const prisma = require('../../config/prisma');

// ── Public ────────────────────────────────────────────────────────────────────
const getPromotions = () =>
  prisma.coupon.findMany({
    where: { status: 1, OR: [{ expiry_date: null }, { expiry_date: { gt: new Date() } }] },
  });

const validateCoupon = async (code) => {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) throw { status: 404, message: 'Coupon not found' };
  if (coupon.status !== 1) throw { status: 422, message: 'Coupon is inactive' };
  if (coupon.expiry_date && coupon.expiry_date < new Date()) throw { status: 422, message: 'Coupon has expired' };
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) throw { status: 422, message: 'Coupon usage limit reached' };
  return coupon;
};

// ── Admin ─────────────────────────────────────────────────────────────────────
const listCoupons = async ({ page = 1, limit = 20, status, search } = {}) => {
  const where = {};
  if (status && status !== 'all') where.isActive = status === 'active';
  if (search) where.code = { contains: search };

  const total = await prisma.coupon.count({ where });
  const data  = await prisma.coupon.findMany({ where, skip: (page - 1) * limit, take: limit });
  return { data, total, pages: Math.ceil(total / limit) };
};

const createCoupon = (data) => prisma.coupon.create({ data });

const getCoupon = (id) => prisma.coupon.findUnique({ where: { id } });

const updateCoupon = async (id, data) => {
  const parsed = { ...data };

  if (parsed.expiry_date !== undefined)
    parsed.expiry_date = parsed.expiry_date ? new Date(parsed.expiry_date) : null;
  if (parsed.discount !== undefined)
    parsed.discount = parsed.discount !== '' ? parseFloat(parsed.discount) : undefined;
  if (parsed.min_amount !== undefined)
    parsed.min_amount = parsed.min_amount !== '' ? parseFloat(parsed.min_amount) : undefined;
  if (parsed.max_discount !== undefined)
    parsed.max_discount = parsed.max_discount !== '' ? parseFloat(parsed.max_discount) : undefined;
  if (parsed.usage_limit !== undefined)
    parsed.usage_limit = parsed.usage_limit !== '' ? parseInt(parsed.usage_limit, 10) : undefined;
  if (parsed.usage_limit_per_rider !== undefined)
    parsed.usage_limit_per_rider = parsed.usage_limit_per_rider !== '' ? parseInt(parsed.usage_limit_per_rider, 10) : undefined;

  Object.keys(parsed).forEach(k => parsed[k] === undefined && delete parsed[k]);
  return prisma.coupon.update({ where: { id }, data: parsed });
};

const deleteCoupon = (id) => prisma.coupon.delete({ where: { id } });

module.exports = {
  getPromotions, validateCoupon,
  listCoupons, createCoupon, getCoupon, updateCoupon, deleteCoupon,
};
