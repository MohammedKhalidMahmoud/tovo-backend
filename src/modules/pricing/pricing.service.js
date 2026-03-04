const prisma = require('../../config/prisma');

exports.listPromotions = async (filters) => {
  const where = {};
  if (filters.status && filters.status !== 'all') where.isActive = filters.status === 'active';
  if (filters.search) where.title = { contains: filters.search, mode: 'insensitive' };

  const total = await prisma.promotion.count({ where });
  const data = await prisma.promotion.findMany({ where, skip: (filters.page - 1) * filters.limit, take: filters.limit });
  return { data, total, pages: Math.ceil(total / filters.limit) };
};

exports.createPromotion = async (data) => {
  return prisma.promotion.create({ data });
};

exports.getPromotion = async (id) => {
  return prisma.promotion.findUnique({ where: { id } });
};

exports.updatePromotion = async (id, data) => {
  return prisma.promotion.update({ where: { id }, data });
};

exports.deactivatePromotion = async (id, reason) => {
  return prisma.promotion.update({ where: { id }, data: { isActive: false } });
};

exports.deletePromotion = async (id) => {
  return prisma.promotion.delete({ where: { id } });
};

exports.listCoupons = async (filters) => {
  const where = {};
  if (filters.status && filters.status !== 'all') where.isActive = filters.status === 'active';
  if (filters.search) where.code = { contains: filters.search, mode: 'insensitive' };

  const total = await prisma.coupon.count({ where });
  const data = await prisma.coupon.findMany({ where, skip: (filters.page - 1) * filters.limit, take: filters.limit });
  return { data, total, pages: Math.ceil(total / filters.limit) };
};

exports.createCoupon = async (data) => {
  return prisma.coupon.create({ data });
};

exports.getCoupon = async (id) => {
  return prisma.coupon.findUnique({ where: { id } });
};

exports.updateCoupon = async (id, data) => {
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

  // Remove keys that resolved to undefined so Prisma ignores them
  Object.keys(parsed).forEach(k => parsed[k] === undefined && delete parsed[k]);

  return prisma.coupon.update({ where: { id }, data: parsed });
};

exports.deleteCoupon = async (id) => {
  return prisma.coupon.delete({ where: { id } });
};
