const router = require('express').Router();
const { body, param } = require('express-validator');
const multer = require('multer');
const controller = require('./users.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const upload = multer({ dest: 'uploads/' });
const userOnly = [authenticate, authorize('user')];

// ── Profile ───────────────────────────────────────────────────────────────────
router.get('/me',                        ...userOnly, controller.getProfile);
router.put('/me',                        ...userOnly, [
  body('name').optional().notEmpty().trim(),
  body('phone').optional().notEmpty().trim(),
  body('language').optional().isIn(['en', 'ar']).withMessage('language must be en or ar'),
  body('notificationsEnabled').optional().isBoolean(),
], validate, controller.updateProfile);
router.patch('/me/avatar',               ...userOnly, upload.single('avatar'), controller.updateAvatar);
router.get('/me/wallet',                 ...userOnly, controller.getWallet);

// ── Saved Addresses ───────────────────────────────────────────────────────────
router.get('/me/addresses',              ...userOnly, controller.getSavedAddresses);
router.post('/me/addresses',             ...userOnly, [
  body('label').notEmpty(),
  body('address').notEmpty(),
  body('lat').isFloat(),
  body('lng').isFloat(),
], validate, controller.addAddress);
router.put('/me/addresses/:id',          ...userOnly, [
  param('id').isUUID().withMessage('id must be a valid UUID'),
  body('label').optional().notEmpty().trim(),
  body('address').optional().notEmpty().trim(),
  body('lat').optional().isFloat(),
  body('lng').optional().isFloat(),
], validate, controller.updateAddress);
router.delete('/me/addresses/:id',       ...userOnly, [
  param('id').isUUID().withMessage('id must be a valid UUID'),
], validate, controller.deleteAddress);

// ── Payment Methods ───────────────────────────────────────────────────────────
router.get('/me/payment-methods',        ...userOnly, controller.getPaymentMethods);
router.post('/me/payment-methods',       ...userOnly, [
  body('brand').isIn(['visa', 'mastercard', 'apple_pay']),
], validate, controller.addPaymentMethod);
router.delete('/me/payment-methods/:id', ...userOnly, [
  param('id').isUUID().withMessage('id must be a valid UUID'),
], validate, controller.deletePaymentMethod);
router.patch('/me/payment-methods/:id/default', ...userOnly, [
  param('id').isUUID().withMessage('id must be a valid UUID'),
], validate, controller.setDefaultPayment);

module.exports = router;
