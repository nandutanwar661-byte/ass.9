// users.js
const express = require('express');
const r = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

r.use(protect);
r.get('/hosts/list', authorize('admin', 'security', 'host'), async (req, res) => {
  const users = await User.find({ role: 'host', isActive: true }).select('name email department role').sort({ name: 1 });
  res.json({ success: true, users });
});
r.get('/', authorize('admin'), async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ success: true, users });
});
r.get('/:id', async (req, res) => {
  if (req.user.role !== 'admin' && String(req.user._id) !== req.params.id) {
    return res.status(403).json({ success: false, message: 'Not authorized to view this user.' });
  }
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, user });
});
r.put('/:id', authorize('admin'), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-password');
  res.json({ success: true, user });
});
r.delete('/:id', authorize('admin'), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User deleted.' });
});

module.exports = r;
