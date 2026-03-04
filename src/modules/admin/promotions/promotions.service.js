// ════════════════════════════════════════════════════════════════════════════════
// Admin Promotions/Coupons Service
// Path: src/modules/admin/promotions/promotions.service.js
// 
// This service provides coupon management operations.
// Coupon CRUD operations are delegated to the pricing service.
// ════════════════════════════════════════════════════════════════════════════════

const pricingService = require('../pricing/pricing.service');

/**
 * List all coupons with optional filters
 * @param {Object} options - Filter and pagination options
 * @returns {Promise<Object>} Paginated coupon list
 */
const listCoupons = (options) => pricingService.listCoupons(options);

/**
 * Create a new coupon
 * @param {Object} data - Coupon data
 * @returns {Promise<Object>} Created coupon
 */
const createCoupon = (data) => pricingService.createCoupon(data);

/**
 * Get a specific coupon by ID
 * @param {string} id - Coupon ID
 * @returns {Promise<Object>} Coupon details
 */
const getCoupon = (id) => pricingService.getCoupon(id);

/**
 * Update a coupon
 * @param {string} id - Coupon ID
 * @param {Object} data - Updated coupon data
 * @returns {Promise<Object>} Updated coupon
 */
const updateCoupon = (id, data) => pricingService.updateCoupon(id, data);

/**
 * Delete a coupon
 * @param {string} id - Coupon ID
 * @returns {Promise<void>}
 */
const deleteCoupon = (id) => pricingService.deleteCoupon(id);

module.exports = {
  listCoupons,
  createCoupon,
  getCoupon,
  updateCoupon,
  deleteCoupon,
};
