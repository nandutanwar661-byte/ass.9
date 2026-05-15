const express = require('express');
const router = express.Router();
const { getLogs, manualCheckLog, getActiveVisitors } = require('../controllers/checkLogController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', authorize('admin', 'security'), getLogs);
router.post('/manual', authorize('admin', 'security'), manualCheckLog);
router.get('/active', authorize('admin', 'security'), getActiveVisitors);

module.exports = router;
