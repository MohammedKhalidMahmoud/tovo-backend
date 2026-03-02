const prisma = require('../../../config/prisma');

exports.listRides = async (filters) => {
  const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search, status, userId, driverId, dateFrom, dateTo } = filters;

  const where = {};

  if (status && status !== 'all') where.status = status;
  if (userId) where.userId = userId;
  if (driverId) where.captainId = driverId;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  if (search) {
    where.OR = [
      { pickupAddress: { contains: search, mode: 'insensitive' } },
      { dropoffAddress: { contains: search, mode: 'insensitive' } },
    ];
  }

  const total = await prisma.trip.count({ where });

  const trips = await prisma.trip.findMany({
    where,
    include: { user: true, captain: true },
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
  });

  const data = trips.map((t) => ({
    id: t.id,
    user: { id: t.user.id, name: t.user.name },
    driver: t.captain ? { id: t.captain.id, name: t.captain.name } : null,
    distance: t.distanceKm,
    fare: t.fare,
    status: t.status,
    date: t.createdAt,
  }));

  return { data, total, pages: Math.ceil(total / limit) };
};

exports.getRideDetails = async (rideId) => {
  const trip = await prisma.trip.findUnique({
    where: { id: rideId },
    include: { user: true, captain: true, paymentMethod: true, rating: true },
  });
  if (!trip) return null;

  return {
    id: trip.id,
    user: trip.user,
    driver: trip.captain,
    startLocation: { lat: trip.pickupLat, lng: trip.pickupLng, address: trip.pickupAddress },
    endLocation: { lat: trip.dropoffLat, lng: trip.dropoffLng, address: trip.dropoffAddress },
    distance: trip.distanceKm,
    fare: trip.fare,
    status: trip.status,
    timestamp: trip.createdAt,
  };
};

exports.cancelRide = async (rideId, data) => {
  const trip = await prisma.trip.findUnique({ where: { id: rideId } });
  if (!trip) throw new Error('Ride not found');

  await prisma.trip.update({ where: { id: rideId }, data: { status: 'cancelled', cancelledAt: new Date(), cancelledBy: 'admin' } });

  if (data.issueRefund) {
    // create simple refund entry on wallet — reuse existing wallet logic
    // For now: return refund placeholder
    return { id: rideId, cancelled: true, refund: { issued: true, amount: data.refundAmount || trip.fare || 0 } };
  }

  return { id: rideId, cancelled: true };
};

exports.issueRefund = async (rideId, refundData) => {
  const trip = await prisma.trip.findUnique({ where: { id: rideId } });
  if (!trip) throw new Error('Ride not found');

  // Assign refund to user wallet
  const user = await prisma.user.findUnique({ where: { id: trip.userId }, include: { wallet: true } });
  if (!user) throw new Error('User not found');

  let wallet = user.wallet;
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId: user.id, balance: refundData.amount, currency: 'EGP' } });
  } else {
    await prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: refundData.amount } } });
  }

  return { refundId: 'REF-' + Date.now(), rideId, amount: refundData.amount };
};

exports.reassignRide = async (rideId, driverId) => {
  const trip = await prisma.trip.findUnique({ where: { id: rideId } });
  if (!trip) throw new Error('Ride not found');

  const driver = await prisma.captain.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error('Driver not found');

  const updated = await prisma.trip.update({ where: { id: rideId }, data: { captainId: driverId, status: 'searching' } });
  return { id: updated.id, newDriver: driverId };
};

exports.advancedSearch = async (filters) => {
  // For brevity, delegate to listRides with filters
  return exports.listRides(filters);
};

exports.exportRides = async (opts) => {
  const { format = 'json', dateFrom, dateTo, status } = opts;
  const where = {};
  if (status && status !== 'all') where.status = status;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const trips = await prisma.trip.findMany({ where, include: { user: true, captain: true } });

  const data = trips.map((t) => ({ id: t.id, user: t.user?.name, driver: t.captain?.name || null, fare: t.fare, status: t.status, date: t.createdAt }));

  return data;
};

/**
 * Create a new ride (admin)
 */
exports.createRide = async (data) => {
  // ensure user exists
  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) throw new Error('User not found');

  // optional captain validation
  if (data.captainId) {
    const captain = await prisma.captain.findUnique({ where: { id: data.captainId } });
    if (!captain) throw new Error('Driver not found');
  }

  const created = await prisma.trip.create({
    data: {
      userId: data.userId,
      captainId: data.captainId || null,
      pickupLat: data.pickupLat,
      pickupLng: data.pickupLng,
      dropoffLat: data.dropoffLat,
      dropoffLng: data.dropoffLng,
      pickupAddress: data.pickupAddress,
      dropoffAddress: data.dropoffAddress,
      fare: data.fare || 0,
      distanceKm: data.distanceKm || 0,
      status: data.status || 'searching',
    },
  });

  return exports.getRideDetails(created.id);
};

/**
 * Update ride
 */
exports.updateRide = async (rideId, updateData) => {
  const trip = await prisma.trip.findUnique({ where: { id: rideId } });
  if (!trip) throw new Error('Ride not found');

  if (updateData.captainId) {
    const captain = await prisma.captain.findUnique({ where: { id: updateData.captainId } });
    if (!captain) throw new Error('Driver not found');
  }

  const updated = await prisma.trip.update({ where: { id: rideId }, data: updateData });
  return exports.getRideDetails(updated.id);
};

/**
 * Delete ride
 */
exports.deleteRide = async (rideId) => {
  const trip = await prisma.trip.findUnique({ where: { id: rideId } });
  if (!trip) throw new Error('Ride not found');

  await prisma.trip.delete({ where: { id: rideId } });
};
