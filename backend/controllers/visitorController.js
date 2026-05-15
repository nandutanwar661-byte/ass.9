const Visitor = require('../models/Visitor');
const Pass = require('../models/Pass');
const { sendEmail } = require('../utils/email');

// @desc    Get all visitors (with filters)
// @route   GET /api/visitors
// @access  Private (admin, security, host)
exports.getVisitors = async (req, res, next) => {
  try {
    const {
      status, date, department, search, page = 1, limit = 20,
    } = req.query;

    const query = {};

    // Host can only see their own visitors
    if (req.user.role === 'host') query.host = req.user._id;

    if (status) query.status = status;
    if (department) query.department = department;

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.visitDate = { $gte: start, $lt: end };
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Visitor.countDocuments(query);
    const visitors = await Visitor.find(query)
      .populate('host', 'name email department')
      .populate('approvedBy', 'name')
      .populate('pass')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      visitors,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single visitor
// @route   GET /api/visitors/:id
// @access  Private
exports.getVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id)
      .populate('host', 'name email department phone')
      .populate('approvedBy', 'name')
      .populate('registeredBy', 'name');

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor not found.' });
    }

    if (req.user.role === 'host' && String(visitor.host) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this visitor.' });
    }
    if (req.user.role === 'visitor') {
      const match = visitor.email?.toLowerCase() === req.user.email?.toLowerCase();
      if (!match) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this visitor.' });
      }
    }

    res.json({ success: true, visitor });
  } catch (err) {
    next(err);
  }
};

// @desc    Register new visitor
// @route   POST /api/visitors
// @access  Private
exports.createVisitor = async (req, res, next) => {
  try {
    const { blacklisted } = await checkBlacklist(req.body.email, req.body.idNumber);
    if (blacklisted) {
      return res.status(403).json({ success: false, message: 'Visitor is blacklisted.' });
    }

    const visitorData = {
      ...req.body,
      registeredBy: req.user._id,
      photo: req.file ? `/uploads/${req.file.filename}` : null,
    };

    // Auto-approve if registering user is security/admin
    if (['admin', 'security'].includes(req.user.role)) {
      visitorData.status = 'approved';
      visitorData.approvedBy = req.user._id;
      visitorData.approvedAt = new Date();
    }

    const visitor = await Visitor.create(visitorData);
    await visitor.populate('host', 'name email department');

    // Notify host
    if (visitor.host && visitor.host.email) {
      await sendEmail({
        to: visitor.host.email,
        subject: `Visitor Registered: ${visitor.fullName}`,
        template: 'visitor-registered',
        data: { visitor, host: visitor.host },
      }).catch(() => {}); // Don't fail if email fails
    }

    res.status(201).json({ success: true, visitor });
  } catch (err) {
    next(err);
  }
};

// @desc    Update visitor
// @route   PUT /api/visitors/:id
// @access  Private (admin, security)
exports.updateVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('host', 'name email department');

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor not found.' });
    }

    res.json({ success: true, visitor });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve visitor
// @route   PUT /api/visitors/:id/approve
// @access  Private (admin, host)
exports.approveVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        approvedBy: req.user._id,
        approvedAt: new Date(),
      },
      { new: true }
    ).populate('host', 'name email');

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor not found.' });
    }

    // Notify visitor
    if (visitor.email) {
      await sendEmail({
        to: visitor.email,
        subject: 'Your visit has been approved — VisiPass',
        template: 'visit-approved',
        data: { visitor },
      }).catch(() => {});
    }

    res.json({ success: true, visitor, message: 'Visitor approved.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject visitor
// @route   PUT /api/visitors/:id/reject
// @access  Private (admin, host)
exports.rejectVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor not found.' });
    }

    res.json({ success: true, visitor, message: 'Visitor rejected.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete visitor
// @route   DELETE /api/visitors/:id
// @access  Private (admin)
exports.deleteVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findByIdAndDelete(req.params.id);
    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor not found.' });
    }
    res.json({ success: true, message: 'Visitor deleted.' });
  } catch (err) {
    next(err);
  }
};

// Helper: check blacklist
async function checkBlacklist(email, idNumber) {
  const visitor = await Visitor.findOne({
    $or: [{ email }, { idNumber }],
    blacklisted: true,
  });
  return { blacklisted: !!visitor };
}
