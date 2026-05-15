const express = require('express');
const router = express.Router();
const {
  getVisitors, getVisitor, createVisitor,
  updateVisitor, approveVisitor, rejectVisitor, deleteVisitor,
} = require('../controllers/visitorController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.route('/')
  .get(authorize('admin', 'security', 'host'), getVisitors)
  .post(authorize('admin', 'security', 'host'), upload.single('photo'), createVisitor);

router.route('/:id')
  .get(getVisitor)
  .put(authorize('admin', 'security'), updateVisitor)
  .delete(authorize('admin'), deleteVisitor);

router.put('/:id/approve', authorize('admin', 'host'), approveVisitor);
router.put('/:id/reject', authorize('admin', 'host'), rejectVisitor);

module.exports = router;
