// ── SERVICE ───────────────────────────────────────────────────────────────────
const prisma = require('../../config/prisma');
const pricingService = require('../admin/pricing/pricing.service');

const getPromotions = () =>
  // return active coupons, honouring expiry_date
  prisma.coupon.findMany({
    where: { status: 1, OR: [{ expiry_date: null }, { expiry_date: { gt: new Date() } }] },
  });

const validateCoupon = async (code) => {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) throw { status: 404, message: 'Coupon not found' };
  if (coupon.status !== 1) throw { status: 422, message: 'Coupon is inactive' };
  if (coupon.expiry_date && coupon.expiry_date < new Date()) throw { status: 422, message: 'Coupon has expired' };
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) throw { status: 422, message: 'Coupon usage limit reached' };
  // NOTE: per‑rider limit enforcement would require tracking usages per user
  return coupon;
};

module.exports = {
  getPromotions,
  validateCoupon,
  // admin coupon operations (delegated to pricing module)
  listCoupons: pricingService.listCoupons,
  createCoupon: pricingService.createCoupon,
  getCoupon: pricingService.getCoupon,
  updateCoupon: pricingService.updateCoupon,
  deleteCoupon: pricingService.deleteCoupon,
};
