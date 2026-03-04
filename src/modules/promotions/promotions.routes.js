// ════════════════════════════════════════════════════════════════════════════════
// Public Promotions Routes
// Path: src/modules/promotions/promotions.routes.js
// Handles public endpoints only
//
// Admin coupon management routes: src/modules/admin/promotions/promotions.routes.js
// ════════════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('./promotions.controller');
const validate = require('../../middleware/validate.middleware');

/**
 * @route GET /api/v1/promotions
 * @description Get all active promotions/coupons (public)
 * @access Public
 */
router.get('/', controller.getPromotions);

/**
 * @route POST /api/v1/promotions/coupons/validate
 * @description Validate a coupon code
 * @access Public
 * @body {string} code - Coupon code to validate
 */
router.post(
  '/coupons/validate',
  [body('code', 'Coupon code is required').trim().notEmpty()],
  validate,
  controller.validateCoupon
);

module.exports = router;
