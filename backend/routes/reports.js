const express = require('express');
const router = express.Router();
const { getDashboard, exportReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/dashboard', authorize('admin', 'security', 'host', 'visitor'), getDashboard);
router.get('/export', authorize('admin'), exportReport);

module.exports = router;
