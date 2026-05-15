const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
  },
  phone: {
    type: String,
    trim: true,
  },
  company: {
    type: String,
    trim: true,
  },
  idType: {
    type: String,
    enum: ['national_id', 'passport', 'driver_license', 'other'],
    default: 'national_id',
  },
  idNumber: {
    type: String,
    trim: true,
  },
  photo: {
    type: String,
    default: null,
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Host is required'],
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
  },
  purpose: {
    type: String,
    enum: ['meeting', 'interview', 'delivery', 'maintenance', 'vendor', 'other'],
    required: [true, 'Purpose is required'],
  },
  purposeNote: {
    type: String,
    trim: true,
  },
  visitDate: {
    type: Date,
    required: [true, 'Visit date is required'],
  },
  expectedDuration: {
    type: Number, // hours
    default: 2,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'checked_in', 'checked_out', 'rejected', 'no_show'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  approvedAt: {
    type: Date,
    default: null,
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  location: {
    type: String,
    default: 'Main Office',
  },
  isVIP: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    trim: true,
  },
  blacklisted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual: full name
visitorSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual: active pass
visitorSchema.virtual('pass', {
  ref: 'Pass',
  localField: '_id',
  foreignField: 'visitor',
  justOne: true,
});

// Index for fast lookups
visitorSchema.index({ email: 1 });
visitorSchema.index({ status: 1 });
visitorSchema.index({ visitDate: 1 });
visitorSchema.index({ host: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);
