const prisma = require('../../config/prisma');
const commissionRepo = require('../earnings/earnings.repository');

exports.dashboardStatistics = async () => {
  const [totalRiders, totalDrivers, totalVehicles] = await Promise.all([
    prisma.user.count({ where: { role: 'customer' } }),
    prisma.user.count({ where: { role: 'driver' } }),
    prisma.vehicle.count(),
  ]);

  const totalRides = await prisma.trip.count();
  const completedRides = await prisma.trip.count({ where: { status: 'completed' } });
  const cancelledRides = await prisma.trip.count({ where: { status: 'cancelled' } });
  const pendingRides = totalRides - completedRides - cancelledRides;

  const revenueAggregate = await prisma.trip.aggregate({
    _sum: { finalFare: true },
    where: { status: 'completed' },
  });
  const totalRevenue = parseFloat(revenueAggregate._sum.finalFare || 0);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayAggregate = await prisma.trip.aggregate({
    _sum: { finalFare: true },
    where: { status: 'completed', createdAt: { gte: startOfToday } },
  });
  const todayRevenue = parseFloat(todayAggregate._sum.finalFare || 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthlyAggregate = await prisma.trip.aggregate({
    _sum: { finalFare: true },
    where: { status: 'completed', createdAt: { gte: startOfMonth } },
  });
  const monthlyRevenue = parseFloat(monthlyAggregate._sum.finalFare || 0);

  const activeDrivers = await prisma.driverProfile.count({
    where: { isOnline: true, user: { role: 'driver' } },
  });

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const activeRiders = await prisma.trip.aggregate({
    _count: { userId: true },
    where: { createdAt: { gte: yesterday } },
  }).then((result) => result._count.userId);

  const [totalCommission, todayCommission] = await Promise.all([
    commissionRepo.sumCommissionLogs(),
    commissionRepo.sumCommissionLogs({ createdAt: { gte: startOfToday } }),
  ]);

  return {
    totalRiders,
    totalDrivers,
    totalVehicles,
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

exports.rideStats = async (filters) => {
  const where = {};
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
  }
  if (filters.driverId) where.driverId = filters.driverId;
  if (filters.userId) where.userId = filters.userId;

  const total = await prisma.trip.count({ where });
  const completed = await prisma.trip.count({ where: { ...where, status: 'completed' } });
  const cancelled = await prisma.trip.count({ where: { ...where, status: 'cancelled' } });
  const onWay = await prisma.trip.count({ where: { ...where, status: 'on_way' } });
  const searching = await prisma.trip.count({ where: { ...where, status: 'searching' } });
  // other statuses could be added as needed
  const revenueData = await prisma.trip.aggregate({ _sum: { finalFare: true }, where: { ...where, status: 'completed' } });

  return {
    totalRides: total,
    completed,
    cancelled,
    onWay,
    searching,
    revenue: revenueData._sum.finalFare || 0,
  };
};

exports.driverPerformance = async (filters) => {
  const where = {};
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
  }

  // simple grouping by driver
  const trips = await prisma.trip.findMany({ where, include: { driver: true } });
  const map = {};
  trips.forEach((t) => {
    if (!t.driverId) return;
    const id = t.driverId;
    if (!map[id]) map[id] = { driverId: id, ridesCompleted: 0, totalEarnings: 0, ratings: [] };
    if (t.status === 'completed') {
      map[id].ridesCompleted++;
      map[id].totalEarnings += parseFloat(t.driverEarnings || 0) + parseFloat(t.discountAmount || 0);
    }
  });

  return Object.values(map);
};

exports.userActivity = async (filters) => {
  const where = {};
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
  }

  const trips = await prisma.trip.findMany({ where, include: { user: true } });
  const map = {};
  trips.forEach((t) => {
    const id = t.userId;
    if (!map[id]) map[id] = { userId: id, ridesTaken: 0, totalSpent: 0, ratings: [] };
    if (t.status === 'completed') {
      map[id].ridesTaken++;
      map[id].totalSpent += parseFloat(t.finalFare || 0);
    }
  });

  return Object.values(map);
};
