const CheckLog = require('../models/CheckLog');
const Visitor = require('../models/Visitor');
const Pass = require('../models/Pass');

// @desc    Get check logs
// @route   GET /api/check-logs
// @access  Private (admin, security)
exports.getLogs = async (req, res, next) => {
  try {
    const { type, date, page = 1, limit = 50 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.timestamp = { $gte: start, $lt: end };
    }

    const logs = await CheckLog.find(query)
      .populate({ path: 'visitor', select: 'firstName lastName company email' })
      .populate('processedBy', 'name')
      .populate({ path: 'pass', select: 'passId accessLevel' })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await CheckLog.countDocuments(query);
    res.json({ success: true, total, logs });
  } catch (err) {
    next(err);
  }
};

// @desc    Manual check-in/out
// @route   POST /api/check-logs/manual
// @access  Private (security)
exports.manualCheckLog = async (req, res, next) => {
  try {
    const { visitorId, passId, type, gate } = req.body;

    const visitor = await Visitor.findById(visitorId);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found.' });

    const pass = await Pass.findById(passId);
    if (!pass) return res.status(404).json({ success: false, message: 'Pass not found.' });

    const log = await CheckLog.create({
      visitor: visitorId,
      pass: passId,
      type,
      processedBy: req.user._id,
      method: 'manual',
      gate: gate || 'Main Entrance',
    });

    const status = type === 'check_in' ? 'checked_in' : 'checked_out';
    await Visitor.findByIdAndUpdate(visitorId, { status });

    res.status(201).json({ success: true, log });
  } catch (err) {
    next(err);
  }
};

// @desc    Get currently checked-in visitors
// @route   GET /api/check-logs/active
// @access  Private
exports.getActiveVisitors = async (req, res, next) => {
  try {
    const visitors = await Visitor.find({ status: 'checked_in' })
      .populate('host', 'name department')
      .sort({ updatedAt: -1 });

    res.json({ success: true, count: visitors.length, visitors });
  } catch (err) {
    next(err);
  }
};
