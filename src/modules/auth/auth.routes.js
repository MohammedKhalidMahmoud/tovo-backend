const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('./auth.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');

// ── POST /auth/register/user ──────────────────────────────────────────────────
router.post('/register/user', [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().trim(),
  body('password').isLength({ min: 8 }),
  body('confirm_password').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
], validate, controller.registerUser);

// ── POST /auth/register/captain ───────────────────────────────────────────────
router.post('/register/captain', [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().trim(),
  body('driving_license').notEmpty().trim(),
  body('password').isLength({ min: 8 }),
  body('confirm_password').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
  // frontend sends vehicle model **name** instead of id
  body('vehicle_model').notEmpty().trim(),
  body('vin').notEmpty().trim(),
], validate, controller.registerCaptain);

// ── POST /auth/login ──────────────────────────────────────────────────────────
router.post('/login', [
  body('identifier').notEmpty().trim().withMessage('identifier (email or phone) is required'),
  body('password').notEmpty(),
  body('role').isIn(['customer', 'driver']),
], validate, controller.login);

// ── POST /auth/admin/login ────────────────────────────────────────────────────
router.post('/admin/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, controller.adminLogin);

// ── POST /auth/logout ─────────────────────────────────────────────────────────
router.post('/logout', authenticate, [
  body('fcm_token').optional().notEmpty().withMessage('fcm_token must not be empty if provided'),
], validate, controller.logout);

// ── POST /auth/token/refresh ──────────────────────────────────────────────────
router.post('/token/refresh', [
  body('refreshToken').notEmpty(),
], validate, controller.refreshToken);

// ── POST /auth/otp/send ───────────────────────────────────────────────────────
router.post('/otp/send', [
  body('phone').notEmpty().trim(),
], validate, controller.sendOtp);

// ── POST /auth/otp/verify ─────────────────────────────────────────────────────
router.post('/otp/verify', [
  body('phone').notEmpty().trim(),
  body('otp_code').isLength({ min: 6, max: 6 }),
], validate, controller.verifyOtp);

// ── POST /auth/forgot-password ────────────────────────────────────────────────
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], validate, controller.forgotPassword);

// ── POST /auth/reset-password ─────────────────────────────────────────────────
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
  body('new_password').isLength({ min: 8 }),
], validate, controller.resetPassword);

// ── POST /auth/social ─────────────────────────────────────────────────────────
router.post('/social', [
  body('provider').isIn(['facebook', 'apple', 'google']),
  body('access_token').notEmpty(),
  body('role').isIn(['customer', 'driver']),
], validate, controller.socialAuth);

module.exports = router;
