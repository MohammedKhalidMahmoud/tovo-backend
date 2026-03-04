// ── REPOSITORY ────────────────────────────────────────────────────────────────
const prisma = require('../../config/prisma');

const getActivePromotions = () =>
  prisma.coupon.findMany({ where: { status: 1, OR: [{ expiry_date: null }, { expiry_date: { gt: new Date() } }] } });

const validateCoupon = (code) =>
  prisma.coupon.findFirst({ where: { code, status: 1 } });

const findCoupon = (code) =>
  prisma.coupon.findUnique({ where: { code } });

module.exports = { getActivePromotions, validateCoupon, findCoupon };
