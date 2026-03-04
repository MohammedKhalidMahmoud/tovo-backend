const router = require('express').Router();
const { query, param, body } = require('express-validator');
const controller = require('./payments.controller');
const validate = require('../../middleware/validate.middleware');

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isString(),
    query('userId').optional().isUUID(),
    query('driverId').optional().isUUID(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
  ],
  validate,
  controller.listPayments
);

router.post(
  '/:id/refund',
  [
    param('id').isUUID(),
    body('amount').isFloat({ min: 0.01 }),
    body('reason').trim().isLength({ min: 1 }),
  ],
  validate,
  controller.refundPayment
);

module.exports = router;