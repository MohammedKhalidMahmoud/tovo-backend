const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('./auth.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');

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

router.post('/register/driver', [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().trim(),
  body('driving_license').notEmpty().trim(),
  body('vehicle_model_id').isUUID().withMessage('Invalid vehicle model ID'),
  body('password').isLength({ min: 8 }),
  body('confirm_password').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
  body('vin').notEmpty().trim(),
], validate, controller.registerDriver);

router.post('/login', [
  body('identifier').notEmpty().trim().withMessage('identifier (email or phone) is required'),
  body('password').notEmpty(),
], validate, controller.login);

router.post('/admin/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, controller.adminLogin);

router.post('/logout', authenticate, [
  body('refreshToken').optional().notEmpty().withMessage('refreshToken must not be empty if provided'),
  body('fcm_token').optional().notEmpty().withMessage('fcm_token must not be empty if provided'),
], validate, controller.logout);

router.post('/token/refresh', [
  body('refreshToken').notEmpty(),
], validate, controller.refreshToken);

router.post('/otp/verify', [
  body('id_token').notEmpty().withMessage('id_token is required'),
], validate, controller.verifyOtp);

router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], validate, controller.forgotPassword);

router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
  body('new_password').isLength({ min: 8 }),
], validate, controller.resetPassword);

router.post('/social', [
  body('provider').isIn(['facebook', 'apple', 'google']),
  body('access_token').notEmpty(),
  body('role').isIn(['customer', 'driver']),
], validate, controller.socialAuth);

module.exports = router;
