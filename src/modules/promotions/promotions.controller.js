const service = require('./promotions.service');
const { success, error } = require('../../utils/response');

const getPromotions = async (req, res, next) => {
  try {
    const data = await service.getPromotions();
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

// ── Admin coupon CRUD ───────────────────────────────────────────────────────
const listCoupons = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const result = await service.listCoupons({ page: +page, limit: +limit, status, search });
    return success(res, result.data, 'Coupons list', 200, { page: +page, per_page: +limit, total: result.total, total_pages: result.pages });
  } catch (err) {
    next(err);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const data = await service.createCoupon(req.body);
    return success(res, data, 'Coupon created');
  } catch (err) {
    next(err);
  }
};

const getCoupon = async (req, res, next) => {
  try {
    const data = await service.getCoupon(req.params.id);
    if (!data) return error(res, 'Coupon not found', 404);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const data = await service.updateCoupon(req.params.id, req.body);
    return success(res, data, 'Coupon updated');
  } catch (err) {
    next(err);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    await service.deleteCoupon(req.params.id);
    return success(res, {}, 'Coupon deleted');
  } catch (err) {
    next(err);
  }
};

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
  listCoupons,
  createCoupon,
  getCoupon,
  updateCoupon,
  deleteCoupon,
};
