const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const passSchema = new mongoose.Schema({
  passId: {
    type: String,
    unique: true,
    default: () => `VIS-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
  },
  visitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visitor',
    required: true,
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null,
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  validFrom: {
    type: Date,
    required: true,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  accessLevel: {
    type: String,
    enum: ['standard', 'extended', 'restricted', 'vip'],
    default: 'standard',
  },
  accessZones: [{
    type: String,
    enum: ['lobby', 'meeting_rooms', 'all_floors', 'executive', 'server_room'],
  }],
  badgeType: {
    type: String,
    enum: ['standard', 'vip', 'contractor', 'delivery'],
    default: 'standard',
  },
  qrCode: {
    type: String, // base64 QR image
  },
  qrToken: {
    type: String,
    unique: true,
    default: () => uuidv4(),
  },
  pdfPath: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'used', 'expired', 'revoked'],
    default: 'active',
  },
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  revokedAt: {
    type: Date,
    default: null,
  },
  revokeReason: {
    type: String,
  },
  sentViaEmail: { type: Boolean, default: false },
  sentViaSMS: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// Auto-expire passes
passSchema.virtual('isExpired').get(function () {
  return new Date() > this.validUntil;
});

passSchema.index({ visitor: 1 });
passSchema.index({ validUntil: 1 });
passSchema.index({ status: 1 });

module.exports = mongoose.model('Pass', passSchema);
