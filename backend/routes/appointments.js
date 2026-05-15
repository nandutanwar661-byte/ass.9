const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPreRegister,
  submitPreRegister,
  listAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointmentController');

// Public pre-registration (must be before auth middleware)
router.get('/pre-register/:token', getPreRegister);
router.put('/pre-register/:token', submitPreRegister);

router.use(protect);

router.get('/', listAppointments);
router.post('/', authorize('admin', 'host'), createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', authorize('admin', 'host'), deleteAppointment);

module.exports = router;
