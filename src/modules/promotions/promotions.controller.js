// ════════════════════════════════════════════════════════════════════════════════
// Public Promotions Controller
// Path: src/modules/promotions/promotions.controller.js
// Handles public promotions and coupon validation endpoints
// 
// Admin coupon management has been moved to: src/modules/admin/promotions/
// ════════════════════════════════════════════════════════════════════════════════

const service = require('./promotions.service');
const { success, error } = require('../../utils/response');

/**
 * Get all active promotions/coupons
 * GET /api/v1/promotions
 * @public
 */
const getPromotions = async (req, res, next) => {
  try {
    const data = await service.getPromotions();
    return success(res, data, 'Promotions retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Validate a coupon code
 * POST /api/v1/promotions/coupons/validate
 * @public
 */
const validateCoupon = async (req, res, next) => {
  try {
    const data = await service.validateCoupon(req.body.code);
    return success(res, data, 'Coupon is valid');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

module.exports = {
  getPromotions,
  validateCoupon,
};
