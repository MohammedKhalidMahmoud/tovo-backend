// ════════════════════════════════════════════════════════════════════════════════
// Rides - Admin Routes
// Path: src/modules/admin/rides/rides.routes.js
// ════════════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const { body, query, param } = require('express-validator');
const controller = require('./rides.controller');
const validate = require('../../middleware/validate.middleware');

// ══════════════════════════════════════════════════════════════════════════════════
// LIST ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/rides
 * List all rides with filtering, searching, and pagination
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be > 0'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1-100'),
    query('sortBy').optional().isIn(['createdAt', 'fare', 'distance', 'duration']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('search').optional().trim().isLength({ min: 1, max: 100 }),
    query('status').optional().isIn(['all', 'searching', 'matched', 'on_way', 'in_progress', 'completed', 'cancelled']),
    query('userId').optional().isUUID(),
    query('driverId').optional().isUUID(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
  ],
  validate,
  controller.listRides
);

// CREATE ride - admin
router.post(
  '/',
  [
    body('userId').isUUID().withMessage('userId is required'),
    body('pickupLat').isFloat(),
    body('pickupLng').isFloat(),
    body('dropoffLat').isFloat(),
    body('dropoffLng').isFloat(),
    body('pickupAddress').notEmpty(),
    body('dropoffAddress').notEmpty(),
    body('fare').optional().isFloat({ min: 0 }),
    body('distanceKm').optional().isFloat({ min: 0 }),
  ],
  validate,
  controller.createRide
);

// UPDATE ride
router.put(
  '/:rideId',
  [
    param('rideId').isUUID(),
    body('status').optional().isString(),
    body('fare').optional().isFloat({ min: 0 }),
    body('captainId').optional().isUUID(),
  ],
  validate,
  controller.updateRide
);

// DELETE ride
router.delete('/:rideId', [param('rideId').isUUID(), query('confirm').equals('true')], validate, controller.deleteRide);

// ══════════════════════════════════════════════════════════════════════════════════
// DETAIL ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/rides/:rideId
 * Get detailed information about a specific ride
 */
router.get(
  '/:rideId',
  [
    param('rideId').isUUID().withMessage('rideId must be a valid UUID'),
  ],
  validate,
  controller.getRide
);

// ══════════════════════════════════════════════════════════════════════════════════
// ACTIONS
// ══════════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/v1/admin/rides/:rideId/cancel
 * Cancel a ride with optional refund
 */
router.post(
  '/:rideId/cancel',
  [
    param('rideId').isUUID().withMessage('rideId must be a valid UUID'),
    body('reason').trim().isLength({ min: 5, max: 200 }),
    body('notes').optional().trim().isLength({ max: 500 }),
    body('issueRefund').optional().isBoolean(),
    body('refundAmount').optional().isFloat({ min: 0 }),
  ],
  validate,
  controller.cancelRide
);

/**
 * POST /api/v1/admin/rides/:rideId/refund
 * Issue refund for a completed ride
 */
router.post(
  '/:rideId/refund',
  [
    param('rideId').isUUID().withMessage('rideId must be a valid UUID'),
    body('amount').isFloat({ min: 0.01 }).withMessage('amount must be > 0'),
    body('reason').trim().isLength({ min: 5, max: 200 }),
    body('notes').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  controller.issueRefund
);

/**
 * POST /api/v1/admin/rides/:rideId/reassign
 * Reassign ride to another driver
 */
router.post(
  '/:rideId/reassign',
  [
    param('rideId').isUUID().withMessage('rideId must be a valid UUID'),
    body('driverId').isUUID().withMessage('driverId must be a valid UUID'),
  ],
  validate,
  controller.reassignRide
);

// ══════════════════════════════════════════════════════════════════════════════════
// SEARCH AND FILTERING
// ══════════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/rides/search/advanced
 * Advanced search with custom filters
 */
router.get(
  '/search/advanced',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['searching', 'matched', 'on_way', 'in_progress', 'completed', 'cancelled']),
    query('fareLow').optional().isFloat({ min: 0 }),
    query('fareHigh').optional().isFloat({ min: 0 }),
    query('durationMin').optional().isInt({ min: 0 }),
    query('durationMax').optional().isInt({ min: 0 }),
    query('distanceMin').optional().isFloat({ min: 0 }),
    query('distanceMax').optional().isFloat({ min: 0 }),
    query('paymentMethod').optional().isIn(['visa', 'mastercard', 'apple_pay', 'wallet']),
    query('ratingMin').optional().isInt({ min: 1, max: 5 }),
    query('ratingMax').optional().isInt({ min: 1, max: 5 }),
  ],
  validate,
  controller.advancedSearch
);

// ══════════════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/rides/export
 * Export rides data in various formats
 */
router.get(
  '/export',
  [
    query('format').isIn(['csv', 'xlsx', 'json']).withMessage('format must be csv, xlsx, or json'),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('status').optional(),
  ],
  validate,
  controller.exportRides
);

module.exports = router;
