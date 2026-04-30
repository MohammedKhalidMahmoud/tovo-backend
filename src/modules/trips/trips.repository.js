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
      perKmRate: true,
      minimumDistanceKm: true,
      perStopCharge: true,
      requiresSenderCode: true,
      requiresReceiverCode: true,
      maxWeightKg: true,
    },
  },
  stops: { orderBy: { order: 'asc' } },
  tollGates: {
    orderBy: { createdAt: 'asc' },
    include: {
      tollGate: {
        select: { id: true, name: true, lat: true, lng: true, isActive: true },
      },
    },
  },
  coupon: { select: { id: true, code: true, discount_type: true, discount: true, max_discount: true } },
  rating: true,
};

const NEARBY_DRIVER_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
  role: true,
  isVerified: true,
  driverProfile: {
    select: {
      isOnline: true,
      rating: true,
      totalTrips: true,
      serviceId: true,
      service: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  vehicle: {
    select: {
      id: true,
      vehicleModel: {
        select: {
          id: true,
          name: true,
          brand: true,
          imageUrl: true,
        },
      },
    },
  },
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

const normalizeNearbyDriver = (driver) => {
  if (!driver) return driver;

  const profile = driver.driverProfile || null;
  const { driverProfile, ...safe } = driver;

  return {
    ...safe,
    isOnline: profile?.isOnline ?? false,
    rating: profile?.rating ?? 0,
    totalTrips: profile?.totalTrips ?? 0,
    serviceId: profile?.serviceId ?? null,
    service: profile?.service ?? null,
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

const findTrips = async ({ where = {}, skip = 0, take = 20 } = {}) => {
  const [trips, total] = await Promise.all([
    prisma.trip.findMany({ where, include: TRIP_INCLUDE, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.trip.count({ where }),
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

const findNearbyDriversByIds = async (driverIds = []) => {
  if (!driverIds.length) return [];

  const drivers = await prisma.user.findMany({
    where: {
      id: { in: driverIds },
      role: 'driver',
    },
    select: NEARBY_DRIVER_SELECT,
  });

  return drivers.map(normalizeNearbyDriver);
};

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
  findTripsByDriver, findTrips, findNewRequests, updateTrip, recordDecline,
  updateTripStop, createRating, findRatingsByTrip, findDriverRatings,
  findTripByShareToken, findTripShareSocketContextByToken, findNearbyDriversByIds,
};
