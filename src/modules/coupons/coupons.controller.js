// ════════════════════════════════════════════════════════════════════════════════
// Public Promotions Controller
// Path: src/modules/promotions/promotions.controller.js
// Handles public promotions and coupon validation endpoints
// 
// Admin coupon management has been moved to: src/modules/admin/promotions/
// ════════════════════════════════════════════════════════════════════════════════

const service = require('./coupons.service');
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

const applyCouponToTrip = async (req, res, next) => {
  try {
    const data = await service.applyCouponToTrip(req.actor.id, req.body.trip_id, req.body.code);
    return success(res, data, 'Coupon applied to trip');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const listCoupons = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const result = await service.listCoupons({ page: +page, limit: +limit, status, search });
    return success(res, result.data, 'Coupons list', 200, { page: +page, per_page: +limit, total: result.total, total_pages: result.pages });
  } catch (err) { next(err); }
};

const createCoupon = async (req, res, next) => {
  try {
    const data = await service.createCoupon(req.body);
    return success(res, data, 'Coupon created', 201);
  } catch (err) { next(err); }
};

const getCoupon = async (req, res, next) => {
  try {
    const data = await service.getCoupon(req.params.id);
    if (!data) return error(res, 'Coupon not found', 404);
    return success(res, data);
  } catch (err) { next(err); }
};

const updateCoupon = async (req, res, next) => {
  try {
    const data = await service.updateCoupon(req.params.id, req.body);
    return success(res, data, 'Coupon updated');
  } catch (err) { next(err); }
};

const deleteCoupon = async (req, res, next) => {
  try {
    await service.deleteCoupon(req.params.id);
    return success(res, {}, 'Coupon deleted');
  } catch (err) { next(err); }
};

module.exports = {
  listCoupons,
  createCoupon,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  getPromotions,
  validateCoupon,
  applyCouponToTrip,
};
