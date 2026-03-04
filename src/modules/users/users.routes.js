const router = require('express').Router();
const { body, param, query } = require('express-validator');
const multer = require('multer');

const usersController = require('./users.controller');
const validate        = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const upload   = multer({ dest: 'uploads/' });
const userOnly  = [authenticate, authorize('user')];
const adminOnly = [authenticate, authorize('admin')];

// ════════════════════════════════════════════════════════════════════════════
// USER-FACING ROUTES  —  prefix: /api/v1/users
// ════════════════════════════════════════════════════════════════════════════

// ── Profile ───────────────────────────────────────────────────────────────────
router.get('/me', ...userOnly, usersController.getProfile);

router.put('/me', ...userOnly, [
  body('name').optional().notEmpty().trim(),
  body('phone').optional().notEmpty().trim(),
  body('language').optional().isIn(['en', 'ar']).withMessage('language must be en or ar'),
  body('notificationsEnabled').optional().isBoolean(),
], validate, usersController.updateProfile);

router.patch('/me/avatar', ...userOnly, upload.single('avatar'), usersController.updateAvatar);

router.get('/me/wallet', ...userOnly, usersController.getWallet);

// ── Saved Addresses ───────────────────────────────────────────────────────────
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

// ── Payment Methods ───────────────────────────────────────────────────────────
router.get('/me/payment-methods', ...userOnly, usersController.getPaymentMethods);

router.post('/me/payment-methods', ...userOnly, [
  body('brand').isIn(['visa', 'mastercard', 'apple_pay']),
], validate, usersController.addPaymentMethod);

router.delete('/me/payment-methods/:id', ...userOnly, [
  param('id').isUUID().withMessage('id must be a valid UUID'),
], validate, usersController.deletePaymentMethod);

router.patch('/me/payment-methods/:id/default', ...userOnly, [
  param('id').isUUID().withMessage('id must be a valid UUID'),
], validate, usersController.setDefaultPayment);

// ════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES  —  prefix: /api/v1/admin/users
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/users
 * List all users with filtering, searching, and pagination.
 */
router.get('/', ...adminOnly, [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be > 0'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1–100'),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'email']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('search').optional().trim().isLength({ min: 1, max: 100 }),
  query('status').optional().isIn(['all', 'active', 'suspended', 'verified', 'unverified']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
], validate, usersController.listUsers);

/**
 * POST /api/v1/admin/users
 * Create a new user (admin).
 */
router.post('/', ...adminOnly, [
  body('name').notEmpty().withMessage('name is required'),
  body('email').isEmail().withMessage('valid email is required').normalizeEmail(),
  body('phone').optional().trim().isMobilePhone(),
  body('password').optional().isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
  body('language').optional().isIn(['en', 'ar']),
], validate, usersController.createUser);

/**
 * GET /api/v1/admin/users/:userId
 * Get detailed information about a specific user.
 */
router.get('/:userId', ...adminOnly, [
  param('userId').isUUID().withMessage('userId must be a valid UUID'),
], validate, usersController.getUser);

/**
 * PUT /api/v1/admin/users/:userId
 * Replace/update user information.
 */
router.put('/:userId', ...adminOnly, [
  param('userId').isUUID().withMessage('userId must be a valid UUID'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim().isMobilePhone(),
  body('language').optional().isIn(['en', 'ar']),
  body('notificationsEnabled').optional().isBoolean(),
], validate, usersController.updateUser);

/**
 * POST /api/v1/admin/users/:userId/suspend
 * Suspend or unsuspend a user account.
 * This is the single, canonical route for suspension — do not use PATCH for this.
 */
router.post('/:userId/suspend', ...adminOnly, [
  param('userId').isUUID().withMessage('userId must be a valid UUID'),
  body('action').isIn(['suspend', 'unsuspend']).withMessage('action must be suspend or unsuspend'),
  body('reason').optional().trim().isLength({ min: 5, max: 500 }),
  body('durationDays').optional().isInt({ min: 1, max: 365 }),
], validate, usersController.suspendUser);

/**
 * POST /api/v1/admin/users/:userId/refund
 * Issue a refund to a user's wallet.
 */
router.post('/:userId/refund', ...adminOnly, [
  param('userId').isUUID().withMessage('userId must be a valid UUID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('amount must be > 0'),
  body('currency').isLength({ min: 3, max: 3 }).toUpperCase(),
  body('tripId').optional().isUUID(),
  body('reason').notEmpty().trim().isLength({ min: 5, max: 200 })
    .withMessage('reason is required and must be between 5–200 characters'),
  body('notes').optional().trim().isLength({ max: 500 }),
], validate, usersController.issueRefund);

/**
 * POST /api/v1/admin/users/:userId/reset-password
 * Reset a user's password.
 */
router.post('/:userId/reset-password', ...adminOnly, [
  param('userId').isUUID().withMessage('userId must be a valid UUID'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], validate, usersController.resetPassword);

/**
 * DELETE /api/v1/admin/users/:userId
 * Permanently delete a user account.
 */
router.delete('/:userId', ...adminOnly, [
  param('userId').isUUID().withMessage('userId must be a valid UUID'),
  query('confirm').equals('true').withMessage('confirm parameter must be true'),
  body('reason').optional().trim().isLength({ min: 5, max: 500 })
    .withMessage('reason must be between 5–500 characters if provided'),
], validate, usersController.deleteUser);

module.exports = router;