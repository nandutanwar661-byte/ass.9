const Visitor = require('../models/Visitor');
const Pass = require('../models/Pass');
const CheckLog = require('../models/CheckLog');

// @desc    Dashboard analytics
// @route   GET /api/reports/dashboard
// @access  Private (admin, security, host, visitor — host/visitor scoped)
exports.getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);

    let vScope = {};
    let passScope = {};
    let logQuery = {};
    let deptPreMatch = null;
    let dailyExtra = {};

    if (req.user.role === 'host') {
      vScope = { host: req.user._id };
      const ids = await Visitor.find({ host: req.user._id }).distinct('_id');
      passScope = ids.length ? { visitor: { $in: ids } } : { visitor: { $in: [] } };
      logQuery = ids.length ? { visitor: { $in: ids } } : { visitor: { $in: [] } };
      deptPreMatch = { host: req.user._id };
      dailyExtra = { host: req.user._id };
    } else if (req.user.role === 'visitor') {
      const vis = await Visitor.findOne({ email: req.user.email.toLowerCase() });
      if (!vis) {
        return res.json({
          success: true,
          stats: {
            activeToday: 0, checkedIn: 0, pendingApprovals: 0, weeklyPasses: 0, totalVisitors: 0,
          },
          byDepartment: [],
          dailyCounts: [],
          recentLogs: [],
        });
      }
      vScope = { _id: vis._id };
      passScope = { visitor: vis._id };
      logQuery = { visitor: vis._id };
      deptPreMatch = { _id: vis._id };
      dailyExtra = { _id: vis._id };
    }

    const [
      activeToday, checkedIn, pendingApprovals,
      weeklyPasses, totalVisitors, recentLogs,
    ] = await Promise.all([
      Visitor.countDocuments({ ...vScope, visitDate: { $gte: today, $lt: tomorrow } }),
      Visitor.countDocuments({ ...vScope, status: 'checked_in' }),
      Visitor.countDocuments({ ...vScope, status: 'pending' }),
      Pass.countDocuments({ ...passScope, createdAt: { $gte: weekStart } }),
      Visitor.countDocuments(vScope),
      CheckLog.find(logQuery).sort({ timestamp: -1 }).limit(10)
        .populate('visitor', 'firstName lastName')
        .populate('processedBy', 'name'),
    ]);

    const byDepartment = await Visitor.aggregate([
      ...(deptPreMatch ? [{ $match: deptPreMatch }] : []),
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const dailyCounts = await Visitor.aggregate([
      {
        $match: {
          visitDate: { $gte: weekStart },
          ...dailyExtra,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitDate' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        activeToday, checkedIn, pendingApprovals, weeklyPasses, totalVisitors,
      },
      byDepartment,
      dailyCounts,
      recentLogs,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export visitor log as JSON (frontend converts to CSV/PDF)
// @route   GET /api/reports/export
// @access  Private (admin)
exports.exportReport = async (req, res, next) => {
  try {
    const { from, to, type } = req.query;
    const query = {};

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const visitors = await Visitor.find(query)
      .populate('host', 'name department email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: visitors.length, visitors });
  } catch (err) {
    next(err);
  }
};
