const prisma = require('../../config/prisma');

const TRIP_INCLUDE = {
  driver: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      driverProfile: {
        select: {
          rating: true,
          totalTrips: true,
        },
      },
    },
  },
  user: { select: { id: true, name: true, avatarUrl: true } },
  service: {
    select: {
      id: true,
      name: true,
      baseFare: true,
      fixedSurcharge: true,
      perStopSurcharge: true,
      requiresSenderCode: true,
      requiresReceiverCode: true,
      maxWeightKg: true,
    },
  },
  stops: { orderBy: { order: 'asc' } },
  coupon: { select: { id: true, code: true, discount_type: true, discount: true, max_discount: true } },
  rating: true,
};

const normalizeDriver = (driver) => {
  if (!driver) return driver;

  const profile = driver.driverProfile || null;
  const { driverProfile, ...safe } = driver;

  return {
    ...safe,
    rating: profile?.rating ?? 0,
    totalTrips: profile?.totalTrips ?? 0,
  };
};

const normalizeTrip = (trip) => {
  if (!trip) return trip;
  return {
    ...trip,
    driver: normalizeDriver(trip.driver),
  };
};

const createTrip = async (data) =>
  normalizeTrip(await prisma.trip.create({ data, include: TRIP_INCLUDE }));

const findTripById = async (id) =>
  normalizeTrip(await prisma.trip.findUnique({ where: { id }, include: TRIP_INCLUDE }));

const findTripByShareToken = async (shareToken) =>
  normalizeTrip(await prisma.trip.findUnique({ where: { shareToken }, include: TRIP_INCLUDE }));

const findTripShareSocketContextByToken = (shareToken) =>
  prisma.trip.findUnique({
    where: { shareToken },
    select: {
      id: true,
      driverId: true,
      status: true,
      shareToken: true,
      shareTokenExpiresAt: true,
    },
  });

const findTripsByUser = async (userId, skip, take) => {
  const [trips, total] = await Promise.all([
    prisma.trip.findMany({ where: { userId }, include: TRIP_INCLUDE, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.trip.count({ where: { userId } }),
  ]);
  return [trips.map(normalizeTrip), total];
};

const findTripsByDriver = async (driverId, skip, take) => {
  const [trips, total] = await Promise.all([
    prisma.trip.findMany({ where: { driverId }, include: TRIP_INCLUDE, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.trip.count({ where: { driverId } }),
  ]);
  return [trips.map(normalizeTrip), total];
};

const findNewRequests = async (driverId) =>
  (await prisma.trip.findMany({
    where: {
      status: 'searching',
      declines: { none: { driverId } },
    },
    include: TRIP_INCLUDE,
    orderBy: { createdAt: 'asc' },
  })).map(normalizeTrip);

const updateTrip = async (id, data) =>
  normalizeTrip(await prisma.trip.update({ where: { id }, data, include: TRIP_INCLUDE }));

const updateTripStop = (tripId, stopId, data) =>
  prisma.tripStop.updateMany({ where: { id: stopId, tripId }, data });

const recordDecline = (tripId, driverId) =>
  prisma.tripDecline.upsert({
    where: { tripId_driverId: { tripId, driverId } },
    create: { tripId, driverId },
    update: {},
  });

const createRating = (data) =>
  prisma.rating.create({ data });

const findRatingsByTrip = (tripId) =>
  prisma.rating.findUnique({ where: { tripId } });

const findDriverRatings = (driverId, skip, take) =>
  Promise.all([
    prisma.rating.findMany({ where: { driverId }, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.rating.count({ where: { driverId } }),
  ]);

module.exports = {
  TRIP_INCLUDE,
  createTrip, findTripById, findTripsByUser,
  findTripsByDriver, findNewRequests, updateTrip, recordDecline,
  updateTripStop, createRating, findRatingsByTrip, findDriverRatings,
  findTripByShareToken, findTripShareSocketContextByToken,
};
