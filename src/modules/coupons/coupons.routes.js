const router = require('express').Router();
const { body, query, param } = require('express-validator');
const controller = require('./coupons.controller');
const validate = require('../../middleware/validate.middleware');

// GET /api/v1/promotions — list active promotions (public)
router.get('/', controller.getPromotions);

// POST /api/v1/promotions/coupons/validate — validate a coupon code (public)
router.post(
  '/coupons/validate',
  [body('code', 'Coupon code is required').trim().notEmpty()],
  validate,
  controller.validateCoupon
);

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['all', 'active', 'inactive']),
  query('search').optional().trim(),
], validate, controller.listCoupons);

router.post('/', [
  body('code').trim().notEmpty().withMessage('code is required'),
  body('discount_type').isIn(['percentage', 'amount']).withMessage('discount_type must be percentage or amount'),
  body('discount').isFloat({ gt: 0 }).withMessage('discount must be a positive number'),
  body('expiry_date').optional().isISO8601().toDate(),
  body('usage_limit').optional().isInt({ min: 1 }),
  body('usage_limit_per_rider').optional().isInt({ min: 1 }),
  body('min_amount').optional().isFloat({ min: 0 }),
  body('max_discount').optional().isFloat({ gt: 0 }),
  body('coupon_type').optional().isIn(['all', 'new_users']),
  body('status').optional().isInt({ min: 0, max: 1 }),
], validate, controller.createCoupon);

router.get('/:id', [param('id').isUUID()], validate, controller.getCoupon);

router.put('/:id', [
  param('id').isUUID(),
  body('code').optional().trim().notEmpty(),
  body('discount_type').optional().isIn(['percentage', 'amount']),
  body('discount').optional().isFloat({ gt: 0 }),
  body('expiry_date').optional().isISO8601().toDate(),
  body('usage_limit').optional().isInt({ min: 1 }),
  body('usage_limit_per_rider').optional().isInt({ min: 1 }),
  body('min_amount').optional().isFloat({ min: 0 }),
  body('max_discount').optional().isFloat({ gt: 0 }),
  body('coupon_type').optional().isIn(['all', 'new_users']),
  body('status').optional().isInt({ min: 0, max: 1 }),
], validate, controller.updateCoupon);

router.delete('/:id', [param('id').isUUID()], validate, controller.deleteCoupon);

module.exports = router;
