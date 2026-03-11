const prisma = require('../../config/prisma');

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
  const revenueData = await prisma.trip.aggregate({ _sum: { fare: true }, where: { ...where, status: 'completed' } });

  return {
    totalRides: total,
    completed,
    cancelled,
    onWay,
    searching,
    revenue: revenueData._sum.fare || 0,
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
      map[id].totalEarnings += parseFloat(t.fare || 0);
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
      map[id].totalSpent += parseFloat(t.fare || 0);
    }
  });

  return Object.values(map);
};