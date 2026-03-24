const prisma = require('../../config/prisma');
const analyticsService = require('../analytics/analytics.service');
const commissionRepo = require('../earnings/earnings.repository');

/**
 * Return a consolidated set of analytics that the admin dashboard UI needs.
 * Re‑uses the existing analytics service methods so we don't duplicate logic.
 */
const adminDashboard = async () => {
  // compute a variety of counters for the dashboard
  const [totalRiders, totalDrivers, totalFleets] = await Promise.all([
    prisma.user.count({ where: { role: 'customer' } }),
    prisma.user.count({ where: { role: 'driver' } }),
    prisma.vehicle.count(),
  ]);

  const totalRides = await prisma.trip.count();
  const completedRides = await prisma.trip.count({ where: { status: 'completed' } });
  const cancelledRides = await prisma.trip.count({ where: { status: 'cancelled' } });
  // treat any non-completed/non-cancelled as pending
  const pendingRides = totalRides - completedRides - cancelledRides;

  const revenueAggregate = await prisma.trip.aggregate({
    _sum: { fare: true },
    where: { status: 'completed' },
  });
  const totalRevenue = parseFloat(revenueAggregate._sum.fare || 0);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayAggr = await prisma.trip.aggregate({
    _sum: { fare: true },
    where: { status: 'completed', createdAt: { gte: startOfToday } },
  });
  const todayRevenue = parseFloat(todayAggr._sum.fare || 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthAggr = await prisma.trip.aggregate({
    _sum: { fare: true },
    where: { status: 'completed', createdAt: { gte: startOfMonth } },
  });
  const monthlyRevenue = parseFloat(monthAggr._sum.fare || 0);

  const activeDrivers = await prisma.user.count({ where: { role: 'driver', isOnline: true } });
  // active riders: users with at least one trip in last 24h
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const activeRiders = await prisma.trip.aggregate({
    _count: { userId: true },
    where: { createdAt: { gte: yesterday } },
  }).then(r => r._count.userId);

  const [totalCommission, todayCommission] = await Promise.all([
    commissionRepo.sumCommissionLogs(),
    commissionRepo.sumCommissionLogs({ createdAt: { gte: startOfToday } }),
  ]);

  return {
    totalRiders,
    totalDrivers,
    totalFleets,
    totalRides,
    completedRides,
    pendingRides,
    cancelledRides,
    totalRevenue,
    todayRevenue,
    monthlyRevenue,
    totalCommission,
    todayCommission,
    activeDrivers,
    activeRiders,
  };
};

/**
 * Paginated list of ride requests. This is essentially a lightweight wrapper
 * around the trips table with very few filters.
 */
const rideRequestList = async ({ page = 1, limit = 20, status, userId, driverId, isSchedule = false }) => {
  const where = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (driverId) where.driverId = driverId;
  if (isSchedule) {
    // return trips that are not yet completed or cancelled;
    where.status = { in: ['searching', 'matched', 'on_way', 'in_progress'] };
  }

  const skip = (page - 1) * limit;
  const [rawItems, total] = await Promise.all([
    prisma.trip.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { driver: true } }),
    prisma.trip.count({ where }),
  ]);

  // map to shape expected by front-end
  const items = rawItems.map((t) => {
    const driver = t.driver
      ? { firstName: t.driver.name || '', lastName: '' }
      : null;

    return {
      ...t,
      totalAmount: t.fare ? parseFloat(t.fare) : 0,
      startAddress: t.pickupAddress,
      driver,
      isSchedule: isSchedule,
      scheduleDatetime: null, // no scheduling field available
    };
  });

  return {
    pagination: {
      page,
      per_page: limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
    items,
  };
};

/**
 * Return a small list of rides that are either in-progress or about to start.
 */
const upcomingRides = async (limit = 10, includeAll = false) => {
  // includeAll parameter currently unused, but kept for compatibility with frontend query
  const where = { status: { in: ['searching', 'matched', 'on_way', 'in_progress'] } };
  const records = await prisma.trip.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { driver: true },
  });

  return records.map((t) => ({
    ...t,
    totalAmount: t.fare ? parseFloat(t.fare) : 0,
    startAddress: t.pickupAddress,
    driver: t.driver ? { firstName: t.driver.name || '', lastName: '' } : null,
    isSchedule: false,
    scheduleDatetime: null,
  }));
};

module.exports = {
  adminDashboard,
  rideRequestList,
  upcomingRides,
};
