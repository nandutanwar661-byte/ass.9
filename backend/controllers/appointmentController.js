const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Visitor = require('../models/Visitor');
const { sendEmail } = require('../utils/email');
const { v4: uuidv4 } = require('uuid');

function parseName(visitorName, body) {
  let firstName = (body.firstName || '').trim();
  let lastName = (body.lastName || '').trim();
  if ((!firstName || !lastName) && visitorName) {
    const parts = String(visitorName).trim().split(/\s+/);
    firstName = parts[0] || 'Guest';
    lastName = parts.slice(1).join(' ') || 'Visitor';
  }
  if (!firstName) firstName = 'Guest';
  if (!lastName) lastName = 'Visitor';
  return { firstName, lastName };
}

async function resolveVisitorForAppointment(body, hostUser) {
  if (body.visitor && mongoose.Types.ObjectId.isValid(body.visitor)) {
    const v = await Visitor.findById(body.visitor);
    if (!v) {
      const err = new Error('Visitor not found.');
      err.statusCode = 404;
      throw err;
    }
    const sameHost = String(v.host) === String(hostUser._id);
    if (hostUser.role !== 'admin' && !sameHost) {
      const err = new Error('Not authorized to schedule for this visitor.');
      err.statusCode = 403;
      throw err;
    }
    return v._id;
  }

  const email = (body.visitorEmail || '').trim().toLowerCase();
  if (!email) {
    const err = new Error('Visitor email is required.');
    err.statusCode = 400;
    throw err;
  }

  const { firstName, lastName } = parseName(body.visitorName, body);

  let visitor = await Visitor.findOne({ email, host: hostUser._id });
  if (!visitor) {
    const visitDate = body.scheduledAt ? new Date(body.scheduledAt) : new Date();
    const hours = Math.max(1, Math.ceil((parseInt(body.duration, 10) || 60) / 60));
    visitor = await Visitor.create({
      firstName,
      lastName,
      email,
      phone: (body.visitorPhone || '').trim(),
      company: (body.visitorCompany || '').trim(),
      host: hostUser._id,
      department: hostUser.department || 'General',
      purpose: body.purpose || 'meeting',
      visitDate,
      expectedDuration: hours,
      status: 'pending',
      registeredBy: hostUser._id,
    });
  } else {
    visitor.firstName = firstName;
    visitor.lastName = lastName;
    if (body.visitorPhone) visitor.phone = String(body.visitorPhone).trim();
    if (body.visitorCompany !== undefined) visitor.company = String(body.visitorCompany).trim();
    await visitor.save();
  }
  return visitor._id;
}

exports.getPreRegister = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({ preRegistrationToken: req.params.token })
      .populate('visitor', 'firstName lastName email phone company')
      .populate('host', 'name email department');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Invitation not found or expired.' });
    }

    if (['cancelled', 'no_show'].includes(appointment.status)) {
      return res.status(410).json({ success: false, message: 'This invitation is no longer active.' });
    }

    res.json({
      success: true,
      appointment: {
        scheduledAt: appointment.scheduledAt,
        duration: appointment.duration,
        meetingRoom: appointment.meetingRoom,
        purpose: appointment.purpose,
        agenda: appointment.agenda,
        status: appointment.status,
        visitor: appointment.visitor,
        host: appointment.host,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.submitPreRegister = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({ preRegistrationToken: req.params.token })
      .populate('visitor');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Invitation not found.' });
    }

    if (['cancelled', 'completed', 'no_show'].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: 'This invitation is no longer active.' });
    }

    const visitorId = appointment.visitor?._id || appointment.visitor;
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor record missing.' });
    }

    const { firstName, lastName, phone, company, idNumber } = req.body;
    if (firstName) visitor.firstName = String(firstName).trim();
    if (lastName) visitor.lastName = String(lastName).trim();
    if (phone !== undefined) visitor.phone = String(phone).trim();
    if (company !== undefined) visitor.company = String(company).trim();
    if (idNumber !== undefined) visitor.idNumber = String(idNumber).trim();
    await visitor.save();

    appointment.status = 'confirmed';
    await appointment.save();

    await appointment.populate([
      { path: 'visitor', select: 'firstName lastName email phone company' },
      { path: 'host', select: 'name email' },
    ]);

    res.json({ success: true, message: 'Registration confirmed.', appointment });
  } catch (err) {
    next(err);
  }
};

exports.listAppointments = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'host') query.host = req.user._id;
    if (req.user.role === 'visitor') {
      const vis = await Visitor.findOne({ email: req.user.email.toLowerCase() });
      if (!vis) {
        return res.json({ success: true, appointments: [] });
      }
      query.visitor = vis._id;
    }
    if (req.query.status) query.status = req.query.status;

    const appointments = await Appointment.find(query)
      .populate('visitor', 'firstName lastName email company')
      .populate('host', 'name email department')
      .sort({ scheduledAt: 1 });

    res.json({ success: true, appointments });
  } catch (err) {
    next(err);
  }
};

exports.createAppointment = async (req, res, next) => {
  try {
    const visitorId = await resolveVisitorForAppointment(req.body, req.user);

    const apptPayload = {
      visitor: visitorId,
      host: req.user._id,
      createdBy: req.user._id,
      preRegistrationToken: uuidv4(),
      scheduledAt: req.body.scheduledAt,
      duration: parseInt(req.body.duration, 10) || 60,
      meetingRoom: req.body.meetingRoom,
      purpose: req.body.purpose,
      agenda: req.body.agenda,
      status: req.body.status || 'scheduled',
      notifyVia: req.body.notifyVia || { email: true, sms: false },
    };

    if (!apptPayload.scheduledAt || !apptPayload.purpose) {
      return res.status(400).json({ success: false, message: 'scheduledAt and purpose are required.' });
    }

    const appointment = await Appointment.create(apptPayload);
    await appointment.populate([
      { path: 'visitor', select: 'firstName lastName email' },
      { path: 'host', select: 'name email' },
    ]);

    if (req.body.notifyVia?.email && appointment.visitor?.email) {
      await sendEmail({
        to: appointment.visitor.email,
        template: 'appointment-invite',
        data: {
          appointment,
          visitorName: `${appointment.visitor.firstName} ${appointment.visitor.lastName}`,
          hostName: appointment.host.name,
        },
      }).catch(() => {});
      appointment.inviteSent = true;
      appointment.inviteSentAt = new Date();
      await appointment.save();
    }

    res.status(201).json({ success: true, appointment });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    next(err);
  }
};

exports.updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    const isOwner = String(appointment.host) === String(req.user._id);
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this appointment.' });
    }

    const allowed = ['status', 'scheduledAt', 'duration', 'meetingRoom', 'purpose', 'agenda', 'notifyVia'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) appointment[key] = req.body[key];
    });
    await appointment.save();

    res.json({ success: true, appointment });
  } catch (err) {
    next(err);
  }
};

exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }
    if (req.user.role !== 'admin' && String(appointment.host) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment.' });
    }
    await appointment.deleteOne();
    res.json({ success: true, message: 'Appointment cancelled.' });
  } catch (err) {
    next(err);
  }
};
