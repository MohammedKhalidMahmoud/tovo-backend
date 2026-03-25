const prisma = require('../../config/prisma');
const { TRIP_INCLUDE } = require('../trips/trips.repository');

const ACTIVE_COUPON_RESERVATION_STATUSES = ['searching', 'matched', 'on_way', 'in_progress'];

const roundMoney = (value) => Number(value.toFixed(2));
const toNumber = (value) => Number(value ?? 0);

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

const applyCouponToTrip = async (userId, tripId, code) =>
  prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId }, include: TRIP_INCLUDE });
    if (!trip) throw { status: 404, message: 'Trip not found' };
    if (trip.userId !== userId) throw { status: 403, message: 'Access denied' };
    if (trip.status !== 'searching') throw { status: 422, message: 'Coupons can only be applied to searching trips' };
    if (trip.couponId) throw { status: 422, message: 'A coupon has already been applied to this trip' };

    const coupon = await tx.coupon.findUnique({ where: { code } });
    if (!coupon) throw { status: 404, message: 'Coupon not found' };
    if (coupon.status !== 1) throw { status: 422, message: 'Coupon is inactive' };
    if (coupon.expiry_date && coupon.expiry_date < new Date()) throw { status: 422, message: 'Coupon has expired' };

    const originalFare = trip.originalFare != null ? toNumber(trip.originalFare) : toNumber(trip.finalFare);
    if (originalFare <= 0) throw { status: 422, message: 'Trip fare is not eligible for coupon application' };
    if (coupon.min_amount != null && originalFare < toNumber(coupon.min_amount)) {
      throw { status: 422, message: 'Trip fare does not meet the coupon minimum amount' };
    }

    if (coupon.coupon_type === 'new_users') {
      const completedTrips = await tx.trip.count({ where: { userId, status: 'completed' } });
      if (completedTrips > 0) throw { status: 422, message: 'This coupon is only available for new riders' };
    }

    const [reservedCount, reservedByUserCount] = await Promise.all([
      tx.trip.count({
        where: {
          couponId: coupon.id,
          status: { in: ACTIVE_COUPON_RESERVATION_STATUSES },
        },
      }),
      tx.trip.count({
        where: {
          couponId: coupon.id,
          userId,
          status: { in: ACTIVE_COUPON_RESERVATION_STATUSES },
        },
      }),
    ]);

    if (coupon.usage_limit != null && coupon.used_count + reservedCount >= coupon.usage_limit) {
      throw { status: 422, message: 'Coupon usage limit reached' };
    }

    if (coupon.usage_limit_per_rider != null) {
      const completedByUserCount = await tx.trip.count({
        where: { couponId: coupon.id, userId, status: 'completed' },
      });

      if (completedByUserCount + reservedByUserCount >= coupon.usage_limit_per_rider) {
        throw { status: 422, message: 'Coupon usage limit per rider reached' };
      }
    }

    let discountAmount =
      coupon.discount_type === 'percentage'
        ? (originalFare * toNumber(coupon.discount)) / 100
        : toNumber(coupon.discount);

    if (coupon.max_discount != null) {
      discountAmount = Math.min(discountAmount, toNumber(coupon.max_discount));
    }

    discountAmount = roundMoney(Math.max(0, Math.min(discountAmount, originalFare)));
    const finalFare = roundMoney(originalFare - discountAmount);

    return tx.trip.update({
      where: { id: trip.id },
      data: {
        couponId: coupon.id,
        couponCode: coupon.code,
        originalFare,
        discountAmount,
        finalFare,
      },
      include: TRIP_INCLUDE,
    });
  });

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
  getPromotions, validateCoupon, applyCouponToTrip,
  listCoupons, createCoupon, getCoupon, updateCoupon, deleteCoupon,
};
