// ════════════════════════════════════════════════════════════════════════════════
// Admin Promotions/Coupons Controller
// Path: src/modules/admin/promotions/promotions.controller.js
// ════════════════════════════════════════════════════════════════════════════════

const service = require('./promotions.service');
const { success, error } = require('../../../utils/response');

/**
 * List all coupons with filters
 * GET /api/v1/admin/promotions/coupons
 */
const listCoupons = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const result = await service.listCoupons({ page: +page, limit: +limit, status, search });
    return success(res, result.data, 'Coupons list', 200, { page: +page, per_page: +limit, total: result.total, total_pages: result.pages });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new coupon
 * POST /api/v1/admin/promotions/coupons
 */
const createCoupon = async (req, res, next) => {
  try {
    const data = await service.createCoupon(req.body);
    return success(res, data, 'Coupon created', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * Get a specific coupon
 * GET /api/v1/admin/promotions/coupons/:id
 */
const getCoupon = async (req, res, next) => {
  try {
    const data = await service.getCoupon(req.params.id);
    if (!data) return error(res, 'Coupon not found', 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

/**
 * Update a coupon
 * PUT /api/v1/admin/promotions/coupons/:id
 */
const updateCoupon = async (req, res, next) => {
  try {
    const data = await service.updateCoupon(req.params.id, req.body);
    return success(res, data, 'Coupon updated');
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a coupon
 * DELETE /api/v1/admin/promotions/coupons/:id
 */
const deleteCoupon = async (req, res, next) => {
  try {
    await service.deleteCoupon(req.params.id);
    return success(res, {}, 'Coupon deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listCoupons,
  createCoupon,
  getCoupon,
  updateCoupon,
  deleteCoupon,
};
