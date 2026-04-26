const router = require('express').Router();
const { param, query } = require('express-validator');
const controller = require('./trips.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');

router.use(authenticate);

router.get(
  '/',
  requirePermission('dispatch:read'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be greater than 0'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
    query('per_page').optional().isInt({ min: 1, max: 100 }).withMessage('per_page must be between 1 and 100'),
    query('status').optional().isIn(['all', 'searching', 'matched', 'on_way', 'in_progress', 'completed', 'cancelled']),
    query('userId').optional().isUUID(),
    query('driverId').optional().isUUID(),
    query('serviceId').optional().isUUID(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('search').optional().trim().isLength({ min: 1, max: 100 }),
  ],
  validate,
  controller.getAdminTrips
);

router.get(
  '/:id',
  requirePermission('dispatch:read'),
  [param('id').isUUID().withMessage('id must be a valid UUID')],
  validate,
  controller.getAdminTripById
);

module.exports = router;
