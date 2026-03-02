const router = require('express').Router();
const { query } = require('express-validator');
const controller = require('./analytics.controller');
const validate = require('../../../middleware/validate.middleware');

router.get(
  '/rides',
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
  [query('dateFrom').optional().isISO8601(), query('dateTo').optional().isISO8601()],
  validate,
  controller.driverPerformance
);

router.get(
  '/users',
  [query('dateFrom').optional().isISO8601(), query('dateTo').optional().isISO8601()],
  validate,
  controller.userActivity
);

module.exports = router;