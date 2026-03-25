const prisma = require('../../config/prisma');

const TRIP_INCLUDE = {
  driver:  { select: { id: true, name: true, avatarUrl: true, rating: true, totalTrips: true } },
  user:    { select: { id: true, name: true, avatarUrl: true } },
  paymentMethod: { select: { id: true, brand: true, maskedNumber: true } },
  service: { select: { id: true, name: true, baseFare: true } },
  coupon:  { select: { id: true, code: true, discount_type: true, discount: true, max_discount: true } },
  rating:  true,
};

const createTrip = (data) =>
  prisma.trip.create({ data, include: TRIP_INCLUDE });

const findTripById = (id) =>
  prisma.trip.findUnique({ where: { id }, include: TRIP_INCLUDE });

const findTripsByUser = (userId, skip, take) =>
  Promise.all([
    prisma.trip.findMany({ where: { userId }, include: TRIP_INCLUDE, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.trip.count({ where: { userId } }),
  ]);

const findTripsByDriver = (driverId, skip, take) =>
  Promise.all([
    prisma.trip.findMany({ where: { driverId }, include: TRIP_INCLUDE, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.trip.count({ where: { driverId } }),
  ]);

// Returns only trips this driver hasn't declined yet
const findNewRequests = (driverId) =>
  prisma.trip.findMany({
    where: {
      status:   'searching',
      declines: { none: { driverId } },
    },
    include:  TRIP_INCLUDE,
    orderBy:  { createdAt: 'asc' },
  });

const updateTrip = (id, data) =>
  prisma.trip.update({ where: { id }, data, include: TRIP_INCLUDE });

// Upsert so double-declining is harmless
const recordDecline = (tripId, driverId) =>
  prisma.tripDecline.upsert({
    where:  { tripId_driverId: { tripId, driverId } },
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
  createRating, findRatingsByTrip, findDriverRatings,
};
