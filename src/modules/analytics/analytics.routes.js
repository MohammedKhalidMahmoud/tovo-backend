const router = require('express').Router();
const { query } = require('express-validator');
const controller = require('./analytics.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const adminOnly = [authenticate, authorize('admin')];

router.get(
  '/rides',
  adminOnly,
  [
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('driverId').optional().isUUID(),
    query('userId').optional().isUUID(),
  ],
  validate,
  controller.rideStats
);

router.get(
  '/drivers',
  adminOnly,
  [query('dateFrom').optional().isISO8601(), query('dateTo').optional().isISO8601()],
  validate,
  controller.driverPerformance
);

router.get(
  '/users',
  adminOnly,
  [query('dateFrom').optional().isISO8601(), query('dateTo').optional().isISO8601()],
  validate,
  controller.userActivity
);

module.exports = router;
