const router = require('express').Router();
const { body, param, query } = require('express-validator');
const multer = require('multer');
const path = require('path');

const usersController = require('./users.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize, requirePermission } = require('../../middleware/auth.middleware');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });
const userOnly = [authenticate, authorize('customer')];
const adminRead = [authenticate, requirePermission('riders:read')];
const adminManage = [authenticate, requirePermission('riders:manage')];

router.get('/me', ...userOnly, usersController.getProfile);

router.put('/me', ...userOnly, [
  body('name').optional().notEmpty().trim(),
  body('phone').optional().notEmpty().trim(),
  body('language').optional().isIn(['en', 'ar']).withMessage('language must be en or ar'),
  body('notificationsEnabled').optional().isBoolean(),
], validate, usersController.updateProfile);

router.put('/me/email', ...userOnly, [
  body('new_email').isEmail().withMessage('new_email must be a valid email').normalizeEmail(),
  body('current_password').notEmpty().withMessage('current_password is required'),
], validate, usersController.requestEmailChange);

router.put('/me/password', ...userOnly, [
  body('current_password').notEmpty().withMessage('current_password is required'),
  body('new_password').isLength({ min: 8 }).withMessage('new_password must be at least 8 characters'),
  body('confirm_password').custom((val, { req }) => {
    if (val !== req.body.new_password) throw new Error('Passwords do not match');
    return true;
  }),
], validate, usersController.changePassword);

router.get('/email-change/verify', [
  query('token').notEmpty().withMessage('token is required'),
], validate, usersController.verifyEmailChange);

router.patch('/me/avatar', ...userOnly, upload.single('avatar'), usersController.updateAvatar);

router.get('/me/wallet', ...userOnly, usersController.getWallet);

router.get('/me/addresses', ...userOnly, usersController.getSavedAddresses);

router.post('/me/addresses', ...userOnly, [
  body('label').notEmpty(),
  body('address').notEmpty(),
  body('lat').isFloat(),
  body('lng').isFloat(),
], validate, usersController.addAddress);

router.put('/me/addresses/:id', ...userOnly, [
  param('id').isUUID().withMessage('id must be a valid UUID'),
  body('label').optional().notEmpty().trim(),
  body('address').optional().notEmpty().trim(),
  body('lat').optional().isFloat(),
  body('lng').optional().isFloat(),
], validate, usersController.updateAddress);

router.delete('/me/addresses/:id', ...userOnly, [
  param('id').isUUID().withMessage('id must be a valid UUID'),
], validate, usersController.deleteAddress);

router.get('/', ...adminRead, [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be > 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1-100'),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'email']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('search').optional().trim().isLength({ min: 1, max: 100 }),
  query('status').optional().isIn(['all', 'active', 'suspended', 'verified', 'unverified']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
], validate, usersController.listUsers);

router.post('/', ...adminManage, [
  body('name').notEmpty().withMessage('name is required'),
  body('email').isEmail().withMessage('valid email is required').normalizeEmail(),
  body('phone').optional().trim().isMobilePhone(),
  body('password').optional().isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
  body('language').optional().isIn(['en', 'ar']),
], validate, usersController.createUser);

router.get('/:userId', ...adminRead, [
  param('userId').isUUID().withMessage('userId must be a valid UUID'),
], validate, usersController.getUser);

router.put('/:userId', ...adminManage, [
  param('userId').isUUID().withMessage('userId must be a valid UUID'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim().isMobilePhone(),
  body('language').optional().isIn(['en', 'ar']),
  body('notificationsEnabled').optional().isBoolean(),
], validate, usersController.updateUser);

router.post('/:userId/suspend', ...adminManage, [
  param('userId').isUUID().withMessage('userId must be a valid UUID'),
  body('action').isIn(['suspend', 'unsuspend']).withMessage('action must be suspend or unsuspend'),
  body('reason').optional().trim().isLength({ min: 5, max: 500 }),
  body('durationDays').optional().isInt({ min: 1, max: 365 }),
], validate, usersController.suspendUser);

router.post('/:userId/refund', ...adminManage, [
  param('userId').isUUID().withMessage('userId must be a valid UUID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('amount must be > 0'),
  body('currency').isLength({ min: 3, max: 3 }).toUpperCase(),
  body('tripId').optional().isUUID(),
  body('reason').notEmpty().trim().isLength({ min: 5, max: 200 })
    .withMessage('reason is required and must be between 5-200 characters'),
  body('notes').optional().trim().isLength({ max: 500 }),
], validate, usersController.issueRefund);

router.post('/:userId/reset-password', ...adminManage, [
  param('userId').isUUID().withMessage('userId must be a valid UUID'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], validate, usersController.resetPassword);

router.delete('/:userId', ...adminManage, [
  param('userId').isUUID().withMessage('userId must be a valid UUID'),
  query('confirm').equals('true').withMessage('confirm parameter must be true'),
  body('reason').optional().trim().isLength({ min: 5, max: 500 })
    .withMessage('reason must be between 5-500 characters if provided'),
], validate, usersController.deleteUser);

module.exports = router;
