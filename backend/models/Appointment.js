const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  visitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visitor',
    required: true,
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scheduledAt: {
    type: Date,
    required: [true, 'Appointment date/time is required'],
  },
  duration: {
    type: Number, // minutes
    default: 60,
  },
  meetingRoom: {
    type: String,
    trim: true,
  },
  purpose: {
    type: String,
    trim: true,
  },
  agenda: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled',
  },
  notifyVia: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false },
  },
  inviteSent: {
    type: Boolean,
    default: false,
  },
  inviteSentAt: {
    type: Date,
  },
  reminderSent: {
    type: Boolean,
    default: false,
  },
  preRegistrationToken: {
    type: String,
    unique: true,
    sparse: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

appointmentSchema.index({ scheduledAt: 1 });
appointmentSchema.index({ host: 1, scheduledAt: 1 });
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
