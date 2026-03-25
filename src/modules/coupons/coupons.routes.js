const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('./coupons.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const customerOnly = [authenticate, authorize('customer')];

// GET /api/v1/promotions — list active promotions (public)
router.get('/', controller.getPromotions);

// POST /api/v1/promotions/coupons/validate — validate a coupon code (public)
router.post(
  '/coupons/validate',
  [body('code', 'Coupon code is required').trim().notEmpty()],
  validate,
  controller.validateCoupon
);

router.post(
  '/coupons/apply',
  ...customerOnly,
  [
    body('trip_id').isUUID().withMessage('trip_id must be a valid UUID'),
    body('code', 'Coupon code is required').trim().notEmpty(),
  ],
  validate,
  controller.applyCouponToTrip
);

module.exports = router;
