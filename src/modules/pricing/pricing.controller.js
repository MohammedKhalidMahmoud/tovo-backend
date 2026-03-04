const service = require('./pricing.service');
const { success, error } = require('../../utils/response');

exports.listPromotions = async (req, res, next) => {
  try {
    const filters = { page: req.query.page || 1, limit: req.query.limit || 50, status: req.query.status || 'all', search: req.query.search };
    const result = await service.listPromotions(filters);
    return success(res, result, 'Promotions retrieved');
  } catch (err) {
    next(err);
  }
};

exports.createPromotion = async (req, res, next) => {
  try {
    const promotion = await service.createPromotion(req.body);
    return success(res, promotion, 'Promotion created', null, 201);
  } catch (err) {
    next(err);
  }
};

exports.getPromotion = async (req, res, next) => {
  try {
    const promotion = await service.getPromotion(req.params.promotionId);
    if (!promotion) return error(res, 'Promotion not found', 404);
    return success(res, promotion, 'Promotion retrieved');
  } catch (err) {
    next(err);
  }
};

exports.updatePromotion = async (req, res, next) => {
  try {
    const promotion = await service.updatePromotion(req.params.promotionId, req.body);
    return success(res, promotion, 'Promotion updated');
  } catch (err) {
    next(err);
  }
};

exports.deactivatePromotion = async (req, res, next) => {
  try {
    await service.deactivatePromotion(req.params.promotionId, req.body.reason);
    return success(res, null, 'Promotion deactivated');
  } catch (err) {
    next(err);
  }
};

exports.deletePromotion = async (req, res, next) => {
  try {
    await service.deletePromotion(req.params.promotionId);
    return success(res, null, 'Promotion deleted');
  } catch (err) {
    next(err);
  }
};

exports.listCoupons = async (req, res, next) => {
  try {
    const filters = { page: req.query.page || 1, limit: req.query.limit || 50, status: req.query.status || 'all', search: req.query.search };
    const result = await service.listCoupons(filters);
    return success(res, result, 'Coupons retrieved');
  } catch (err) {
    next(err);
  }
};

exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await service.createCoupon(req.body);
    return success(res, coupon, 'Coupon created', null, 201);
  } catch (err) {
    next(err);
  }
};

exports.getCoupon = async (req, res, next) => {
  try {
    const coupon = await service.getCoupon(req.params.couponId);
    if (!coupon) return error(res, 'Coupon not found', 404);
    return success(res, coupon, 'Coupon retrieved');
  } catch (err) {
    next(err);
  }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await service.updateCoupon(req.params.couponId, req.body);
    return success(res, coupon, 'Coupon updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    await service.deleteCoupon(req.params.couponId);
    return success(res, null, 'Coupon deleted');
  } catch (err) {
    next(err);
  }
};
