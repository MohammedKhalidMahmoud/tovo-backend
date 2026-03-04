// ════════════════════════════════════════════════════════════════════════════════
// Admin Promotions/Coupons Routes
// Path: src/modules/admin/promotions/promotions.routes.js
// Mounted at: /api/v1/admin/promotions
// ════════════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const { body, query, param } = require('express-validator');
const controller = require('./promotions.controller');
const validate = require('../../../middleware/validate.middleware');

/**
 * GET /api/v1/admin/promotions/coupons
 * List all coupons with filters
 */
router.get('/coupons', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['all', 'active', 'inactive']),
  query('search').optional().trim(),
], validate, controller.listCoupons);

/**
 * POST /api/v1/admin/promotions/coupons
 * Create a new coupon
 */
router.post('/coupons', [
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

/**
 * GET /api/v1/admin/promotions/coupons/:id
 * Get a specific coupon
 */
router.get('/coupons/:id', [
  param('id').isUUID().withMessage('id must be a valid UUID'),
], validate, controller.getCoupon);

/**
 * PUT /api/v1/admin/promotions/coupons/:id
 * Update a coupon
 */
router.put('/coupons/:id', [
  param('id').isUUID().withMessage('id must be a valid UUID'),
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

/**
 * DELETE /api/v1/admin/promotions/coupons/:id
 * Delete a coupon
 */
router.delete('/coupons/:id', [
  param('id').isUUID().withMessage('id must be a valid UUID'),
], validate, controller.deleteCoupon);

module.exports = router;
