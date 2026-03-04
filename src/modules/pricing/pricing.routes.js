// ════════════════════════════════════════════════════════════════════════════════
// Pricing - Admin Routes
// Path: src/modules/admin/pricing/pricing.routes.js
// ════════════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const { body, query, param } = require('express-validator');
const controller = require('./pricing.controller');
const validate = require('../../middleware/validate.middleware');

// ══════════════════════════════════════════════════════════════════════════════════
// PROMOTIONS
// ══════════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/pricing/promotions
 * List all promotions
 */
router.get(
  '/promotions',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['all', 'active', 'expired', 'scheduled']),
    query('search').optional().trim(),
  ],
  validate,
  controller.listPromotions
);

/**
 * POST /api/v1/admin/pricing/promotions
 * Create new promotion
 */
router.post(
  '/promotions',
  [
    body('title').trim().isLength({ min: 3, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('discountPct').isInt({ min: 1, max: 99 }),
    body('imageUrl').optional().isURL(),
    body('validFrom').optional().isISO8601(),
    body('validUntil').optional().isISO8601(),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  controller.createPromotion
);

/**
 * GET /api/v1/admin/pricing/promotions/:promotionId
 * Get promotion details
 */
router.get(
  '/promotions/:promotionId',
  [
    param('promotionId').isUUID().withMessage('promotionId must be a valid UUID'),
  ],
  validate,
  controller.getPromotion
);

/**
 * PUT /api/v1/admin/pricing/promotions/:promotionId
 * Update promotion
 */
router.put(
  '/promotions/:promotionId',
  [
    param('promotionId').isUUID().withMessage('promotionId must be a valid UUID'),
    body('title').optional().trim().isLength({ min: 3, max: 100 }),
    body('discountPct').optional().isInt({ min: 1, max: 99 }),
    body('validUntil').optional().isISO8601(),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  controller.updatePromotion
);

/**
 * POST /api/v1/admin/pricing/promotions/:promotionId/deactivate
 * Deactivate promotion
 */
router.post(
  '/promotions/:promotionId/deactivate',
  [
    param('promotionId').isUUID().withMessage('promotionId must be a valid UUID'),
    body('reason').optional().trim().isLength({ max: 200 }),
  ],
  validate,
  controller.deactivatePromotion
);

/**
 * DELETE /api/v1/admin/pricing/promotions/:promotionId
 * Delete promotion
 */
router.delete(
  '/promotions/:promotionId',
  [
    param('promotionId').isUUID().withMessage('promotionId must be a valid UUID'),
    query('confirm').equals('true').withMessage('confirm must be true'),
  ],
  validate,
  controller.deletePromotion
);

// ══════════════════════════════════════════════════════════════════════════════════
// COUPONS
// ══════════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/pricing/coupons
 * List all coupon codes
 */
router.get(
  '/coupons',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['all', 'active', 'expired', 'fully_used']),
    query('search').optional().trim(),
  ],
  validate,
  controller.listCoupons
);

/**
 * POST /api/v1/admin/pricing/coupons
 * Create new coupon code
 */
router.post(
  '/coupons',
  [
    body('code').trim().isLength({ min: 3, max: 20 }).isAlphanumeric().toUpperCase(),
    body('discountPct').isInt({ min: 1, max: 99 }),
    body('maxUses').isInt({ min: -1 }).withMessage('maxUses must be -1 or positive integer'),
    body('validFrom').optional().isISO8601(),
    body('validUntil').optional().isISO8601(),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  controller.createCoupon
);

/**
 * GET /api/v1/admin/pricing/coupons/:couponId
 * Get coupon details
 */
router.get(
  '/coupons/:couponId',
  [
    param('couponId').isUUID().withMessage('couponId must be a valid UUID'),
  ],
  validate,
  controller.getCoupon
);

/**
 * PUT /api/v1/admin/pricing/coupons/:couponId
 * Update coupon
 */
router.put(
  '/coupons/:couponId',
  [
    param('couponId').isUUID().withMessage('couponId must be a valid UUID'),
    body('code').optional().trim().isAlphanumeric().toUpperCase(),
    body('discountPct').optional().isInt({ min: 1, max: 99 }),
    body('maxUses').optional().isInt({ min: -1 }),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  controller.updateCoupon
);

/**
 * DELETE /api/v1/admin/pricing/coupons/:couponId
 * Delete coupon
 */
router.delete(
  '/coupons/:couponId',
  [
    param('couponId').isUUID().withMessage('couponId must be a valid UUID'),
    query('confirm').equals('true').withMessage('confirm must be true'),
  ],
  validate,
  controller.deleteCoupon
);

module.exports = router;
