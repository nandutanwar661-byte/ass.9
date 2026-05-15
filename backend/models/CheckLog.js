const mongoose = require('mongoose');

const checkLogSchema = new mongoose.Schema({
  visitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visitor',
    required: true,
  },
  pass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pass',
    required: true,
  },
  type: {
    type: String,
    enum: ['check_in', 'check_out'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  method: {
    type: String,
    enum: ['qr_scan', 'manual', 'auto'],
    default: 'qr_scan',
  },
  gate: {
    type: String,
    default: 'Main Entrance',
  },
  location: {
    type: String,
    default: 'Main Office',
  },
  notes: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  deviceInfo: {
    type: String,
  },
}, {
  timestamps: true,
});

checkLogSchema.index({ visitor: 1, timestamp: -1 });
checkLogSchema.index({ timestamp: -1 });
checkLogSchema.index({ type: 1 });

module.exports = mongoose.model('CheckLog', checkLogSchema);
