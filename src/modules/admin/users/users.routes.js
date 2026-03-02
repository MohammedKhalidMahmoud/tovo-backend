// ════════════════════════════════════════════════════════════════════════════════
// Users - Admin Routes
// Path: src/modules/admin/users/users.routes.js
// ════════════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const { body, query, param } = require('express-validator');
const usersController = require('./users.controller');
const validate = require('../../../middleware/validate.middleware');

// ══════════════════════════════════════════════════════════════════════════════════
// LIST ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/users
 * List all users with filtering, searching, and pagination
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be > 0'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1-100'),
    query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'email']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('search').optional().trim().isLength({ min: 1, max: 100 }),
    query('status').optional().isIn(['all', 'active', 'suspended', 'verified', 'unverified']),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
  ],
  validate,
  usersController.listUsers
);

// ══════════════════════════════════════════════════════════════════════════════════
// DETAIL ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/users/:userId
 * Get detailed information about a specific user
 */
router.get(
  '/:userId',
  [
    param('userId').isUUID().withMessage('userId must be a valid UUID'),
  ],
  validate,
  usersController.getUser
);

// CREATE endpoint - allow admin to create a user
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('name is required'),
    body('email').isEmail().withMessage('valid email is required').normalizeEmail(),
    body('phone').optional().trim().isMobilePhone(),
    body('password').optional().isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
  ],
  validate,
  usersController.createUser
);

// ══════════════════════════════════════════════════════════════════════════════════
// UPDATE ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════════════

/**
 * PUT /api/v1/admin/users/:userId
 * Update user information
 */
router.put(
  '/:userId',
  [
    param('userId').isUUID().withMessage('userId must be a valid UUID'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim().isMobilePhone(),
    body('language').optional().isIn(['en', 'ar']),
    body('notificationsEnabled').optional().isBoolean(),
  ],
  validate,
  usersController.updateUser
);

// support PATCH for partial updates or suspend actions
router.patch(
  '/:userId',
  [
    param('userId').isUUID().withMessage('userId must be a valid UUID'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim().isMobilePhone(),
    body('language').optional().isIn(['en', 'ar']),
    body('notificationsEnabled').optional().isBoolean(),
    // suspend fields
    body('action').optional().isIn(['suspend','unsuspend']).withMessage('action must be suspend or unsuspend'),
    body('reason').optional().trim().isLength({ min: 5, max: 500 }),
    body('durationDays').optional().isInt({ min: 1, max: 365 }),
  ],
  validate,
  (req, res, next) => {
    if (req.body.action) {
      return usersController.suspendUser(req, res, next);
    }
    return usersController.updateUser(req, res, next);
  }
);


/**
 * POST /api/v1/admin/users/:userId/suspend
 * Suspend or unsuspend a user account
 */
router.post(
  '/:userId/suspend',
  [
    param('userId').isUUID().withMessage('userId must be a valid UUID'),
    body('action').isIn(['suspend', 'unsuspend']).withMessage('action must be suspend or unsuspend'),
    body('reason').optional().trim().isLength({ min: 5, max: 500 }),
    body('durationDays').optional().isInt({ min: 1, max: 365 }),
  ],
  validate,
  usersController.suspendUser
);

/**
 * POST /api/v1/admin/users/:userId/refund
 * Issue a refund to a user account
 */
router.post(
  '/:userId/refund',
  [
    param('userId').isUUID().withMessage('userId must be a valid UUID'),
    body('amount').isFloat({ min: 0.01 }).withMessage('amount must be > 0'),
    body('currency').isLength({ min: 3, max: 3 }).toUpperCase(),
    body('tripId').optional().isUUID(),
    body('reason').trim().isLength({ min: 5, max: 200 }),
    body('notes').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  usersController.issueRefund
);

/**
 * POST /api/v1/admin/users/:userId/reset-password
 * Reset a user's password
 */
router.post(
  '/:userId/reset-password',
  [
    param('userId').isUUID().withMessage('userId must be a valid UUID'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  usersController.resetPassword
);

// ══════════════════════════════════════════════════════════════════════════════════
// DELETE ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════════════

/**
 * DELETE /api/v1/admin/users/:userId
 * Delete a user account permanently
 */
router.delete(
  '/:userId',
  [
    param('userId').isUUID().withMessage('userId must be a valid UUID'),
    query('confirm').equals('true').withMessage('confirm parameter must be true'),
  ],
  validate,
  usersController.deleteUser
);

module.exports = router;
