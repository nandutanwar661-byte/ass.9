const Pass = require('../models/Pass');
const Visitor = require('../models/Visitor');
const CheckLog = require('../models/CheckLog');
const { generateQRCode } = require('../utils/qrGenerator');
const { generatePassPDF } = require('../utils/pdfGenerator');
const { sendEmail } = require('../utils/email');
const { sendSMS } = require('../utils/sms');

const canAccessPass = (user, pass) => {
  if (['admin', 'security'].includes(user.role)) return true;
  if (user.role === 'visitor' && pass?.visitor?.email && user.email) {
    return pass.visitor.email.toLowerCase() === user.email.toLowerCase();
  }
  return false;
};

// @desc    Issue a new pass
// @route   POST /api/passes
// @access  Private (admin, security)
exports.issuePass = async (req, res, next) => {
  try {
    const {
      visitor: visitorId, validFrom, validUntil,
      accessLevel, accessZones, badgeType, appointment,
      notifyEmail, notifySMS,
    } = req.body;

    const visitor = await Visitor.findById(visitorId).populate('host', 'name email department');
    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor not found.' });
    }

    // Revoke any existing active pass
    await Pass.updateMany(
      { visitor: visitorId, status: 'active' },
      { status: 'revoked', revokedBy: req.user._id, revokedAt: new Date(), revokeReason: 'New pass issued' }
    );

    // Generate QR token and image
    const qrToken = require('uuid').v4();
    const qrCode = await generateQRCode(qrToken);

    const pass = await Pass.create({
      visitor: visitorId,
      appointment: appointment || null,
      issuedBy: req.user._id,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      accessLevel: accessLevel || 'standard',
      accessZones: accessZones || ['lobby', 'meeting_rooms'],
      badgeType: badgeType || 'standard',
      qrCode,
      qrToken,
    });

    // Update visitor status
    await Visitor.findByIdAndUpdate(visitorId, { status: 'approved' });

    // Generate PDF badge
    try {
      const pdfPath = await generatePassPDF(pass, visitor);
      pass.pdfPath = pdfPath;
      await pass.save();
    } catch (pdfErr) {
      console.error('PDF generation failed:', pdfErr.message);
    }

    // Send notifications
    if (notifyEmail && visitor.email) {
      await sendEmail({
        to: visitor.email,
        subject: `Your Visitor Pass — ${visitor.fullName}`,
        template: 'pass-issued',
        data: { visitor, pass },
      }).catch(() => {});
      pass.sentViaEmail = true;
      await pass.save();
    }

    if (notifySMS && visitor.phone) {
      await sendSMS(
        visitor.phone,
        `Hi ${visitor.firstName}, your VisiPass is ready. Pass ID: ${pass.passId}. Valid: ${new Date(validFrom).toLocaleString()} – ${new Date(validUntil).toLocaleString()}`
      ).catch(() => {});
      pass.sentViaSMS = true;
      await pass.save();
    }

    await pass.populate([
      { path: 'visitor', populate: { path: 'host', select: 'name email' } },
      { path: 'issuedBy', select: 'name' },
    ]);

    res.status(201).json({ success: true, pass });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all passes
// @route   GET /api/passes
// @access  Private (admin, security)
exports.getPasses = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status) query.status = status;

    if (req.user.role === 'visitor') {
      const visitor = await Visitor.findOne({ email: req.user.email });
      if (!visitor) {
        return res.status(404).json({ success: false, message: 'Visitor record not found.' });
      }
      query.visitor = visitor._id;
    } else if (!['admin', 'security'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view passes.' });
    }

    const passes = await Pass.find(query)
      .populate({ path: 'visitor', select: 'firstName lastName email company host', populate: { path: 'host', select: 'name department' } })
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Pass.countDocuments(query);

    res.json({ success: true, total, passes });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single pass
// @route   GET /api/passes/:id
// @access  Private
exports.getPass = async (req, res, next) => {
  try {
    const pass = await Pass.findById(req.params.id)
      .populate({ path: 'visitor', populate: { path: 'host', select: 'name email department' } })
      .populate('issuedBy', 'name');

    if (!pass) return res.status(404).json({ success: false, message: 'Pass not found.' });
    if (!canAccessPass(req.user, pass)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this pass.' });
    }
    res.json({ success: true, pass });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify pass by QR token (check-in/out)
// @route   POST /api/passes/verify
// @access  Private (security)
exports.verifyPass = async (req, res, next) => {
  try {
    const { qrToken } = req.body;

    const pass = await Pass.findOne({ qrToken })
      .populate({ path: 'visitor', populate: { path: 'host', select: 'name email department' } });

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Invalid QR code.' });
    }

    const now = new Date();
    if (pass.status === 'revoked') {
      return res.status(403).json({ success: false, message: 'Pass has been revoked.' });
    }
    if (now > pass.validUntil) {
      await Pass.findByIdAndUpdate(pass._id, { status: 'expired' });
      return res.status(403).json({ success: false, message: 'Pass has expired.' });
    }
    if (now < pass.validFrom) {
      return res.status(403).json({ success: false, message: 'Pass is not yet valid.' });
    }

    // Determine check-in or check-out
    const lastLog = await CheckLog.findOne({ pass: pass._id }).sort({ timestamp: -1 });
    const action = !lastLog || lastLog.type === 'check_out' ? 'check_in' : 'check_out';

    const log = await CheckLog.create({
      visitor: pass.visitor._id,
      pass: pass._id,
      type: action,
      processedBy: req.user._id,
      method: 'qr_scan',
      gate: req.body.gate || 'Main Entrance',
    });

    // Update visitor status
    const visitorStatus = action === 'check_in' ? 'checked_in' : 'checked_out';
    await Visitor.findByIdAndUpdate(pass.visitor._id, { status: visitorStatus });

    if (action === 'check_out') {
      await Pass.findByIdAndUpdate(pass._id, { status: 'used' });
    }

    res.json({
      success: true,
      action,
      pass,
      log,
      message: action === 'check_in' ? 'Welcome! Visitor checked in.' : 'Goodbye! Visitor checked out.',
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyPublicPass = async (req, res, next) => {
  try {
    const { token } = req.params;
    const pass = await Pass.findOne({ qrToken: token })
      .populate({ path: 'visitor', populate: { path: 'host', select: 'name email department' } });

    if (!pass) {
      return res.status(404).json({ success: false, valid: false, message: 'Invalid pass token.' });
    }

    const now = new Date();
    if (pass.status === 'revoked') {
      return res.status(403).json({ success: false, valid: false, message: 'Pass has been revoked.' });
    }
    if (now > pass.validUntil) {
      await Pass.findByIdAndUpdate(pass._id, { status: 'expired' });
      return res.status(403).json({ success: false, valid: false, message: 'Pass has expired.' });
    }
    if (now < pass.validFrom) {
      return res.status(403).json({ success: false, valid: false, message: 'Pass is not yet valid.' });
    }

    res.json({
      success: true,
      valid: true,
      pass: {
        passId: pass.passId,
        badgeType: pass.badgeType,
        status: pass.status,
        visitor: {
          firstName: pass.visitor.firstName,
          lastName: pass.visitor.lastName,
          company: pass.visitor.company,
          host: pass.visitor.host,
        },
      },
      message: 'Pass is valid.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Revoke a pass
// @route   PUT /api/passes/:id/revoke
// @access  Private (admin, security)
exports.revokePass = async (req, res, next) => {
  try {
    const pass = await Pass.findByIdAndUpdate(
      req.params.id,
      {
        status: 'revoked',
        revokedBy: req.user._id,
        revokedAt: new Date(),
        revokeReason: req.body.reason || 'Manually revoked',
      },
      { new: true }
    );

    if (!pass) return res.status(404).json({ success: false, message: 'Pass not found.' });
    res.json({ success: true, pass, message: 'Pass revoked.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Download pass PDF
// @route   GET /api/passes/:id/pdf
// @access  Private
exports.downloadPDF = async (req, res, next) => {
  try {
    const pass = await Pass.findById(req.params.id)
      .populate({ path: 'visitor', populate: { path: 'host', select: 'name department' } });

    if (!pass) return res.status(404).json({ success: false, message: 'Pass not found.' });
    if (!canAccessPass(req.user, pass)) {
      return res.status(403).json({ success: false, message: 'Not authorized to download this pass.' });
    }

    const path = require('path');
    const fs = require('fs');

    if (pass.pdfPath && fs.existsSync(path.join(__dirname, '..', pass.pdfPath))) {
      return res.download(path.join(__dirname, '..', pass.pdfPath));
    }

    // Re-generate PDF on the fly
    const pdfBuffer = await generatePassPDF(pass, pass.visitor, true);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename=pass-${pass.passId}.pdf` });
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};
