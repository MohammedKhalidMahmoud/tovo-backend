const router = require('express').Router();
const { body } = require('express-validator');
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

module.exports = router;
