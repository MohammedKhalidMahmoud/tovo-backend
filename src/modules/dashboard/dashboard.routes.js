// ════════════════════════════════════════════════════════════════════════════════
// Dashboard / Public analytics routes
// Path: src/modules/dashboard/dashboard.routes.js
// ════════════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const { query } = require('express-validator');
const controller = require('./dashboard.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const adminOnly = [authenticate, authorize('admin')];

/**
 * GET /api/v1/dashboard/statistics
 * high‑level summary used by the admin UI and owner dashboard
 */
router.get(['/statistics', '/admin-dashboard'], adminOnly, controller.adminDashboard);

/**
 * GET /api/v1/dashboard/ride-requests
 * generic list of ride requests for dashboard views
 */
router.get(
  ['/ride-requests', '/ride-requests/riderequest-list'],
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be > 0'),
    query('per_page').optional().isInt({ min: 1, max: 100 }).withMessage('per_page must be between 1-100'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1-100'),
    query('status').optional().isString(),
    query('userId').optional().isUUID(),
    query('driverId').optional().isUUID(),
    query('isSchedule').optional().isBoolean().withMessage('isSchedule must be boolean'),
  ],
  validate,
  controller.rideRequestList
);

/**
 * GET /api/v1/dashboard/rides/upcoming
 * fetch short list of upcoming/in-progress rides
 */
router.get(
  '/rides/upcoming',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1-100'),
    query('all').optional().isBoolean().withMessage('all must be boolean'),
  ],
  validate,
  controller.upcomingRides
);

module.exports = router;
