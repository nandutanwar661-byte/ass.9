// ─── passes.js ───────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const {
  issuePass, getPasses, getPass,
  verifyPass, verifyPublicPass, revokePass, downloadPDF,
} = require('../controllers/passController');
const { protect, authorize } = require('../middleware/auth');

router.get('/public/:token', verifyPublicPass);

router.use(protect);
router.route('/').get(getPasses).post(authorize('admin', 'security'), issuePass);
router.post('/verify', authorize('admin', 'security'), verifyPass);
router.route('/:id').get(getPass);
router.put('/:id/revoke', authorize('admin', 'security'), revokePass);
router.get('/:id/pdf', downloadPDF);

module.exports = router;
