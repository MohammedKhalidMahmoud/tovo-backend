const prisma = require('../../config/prisma');

const TRIP_INCLUDE = {
  captain: { select: { id: true, name: true, avatarUrl: true, rating: true, totalTrips: true } },
  user: { select: { id: true, name: true, avatarUrl: true } },
  paymentMethod: { select: { id: true, brand: true, maskedNumber: true } },
  service: { select: { id: true, name: true, baseFare: true } },
  rating: true,
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

const findTripsByCaptain = (captainId, skip, take) =>
  Promise.all([
    prisma.trip.findMany({ where: { captainId }, include: TRIP_INCLUDE, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.trip.count({ where: { captainId } }),
  ]);

// Returns only trips this captain hasn't declined yet
const findNewRequests = (captainId) =>
  prisma.trip.findMany({
    where: {
      status: 'searching',
      declines: { none: { captainId } },
    },
    include: TRIP_INCLUDE,
    orderBy: { createdAt: 'asc' },
  });

const updateTrip = (id, data) =>
  prisma.trip.update({ where: { id }, data, include: TRIP_INCLUDE });

// Upsert so double-declining is harmless
const recordDecline = (tripId, captainId) =>
  prisma.tripDecline.upsert({
    where: { tripId_captainId: { tripId, captainId } },
    create: { tripId, captainId },
    update: {},
  });

// Include trip.userId so the controller can route the socket event
const createFareOffer = (data) =>
  prisma.fareOffer.create({
    data,
    include: { trip: { select: { userId: true } } },
  });

const createRating = (data) =>
  prisma.rating.create({ data });

const findRatingsByTrip = (tripId) =>
  prisma.rating.findUnique({ where: { tripId } });

const findCaptainRatings = (captainId, skip, take) =>
  Promise.all([
    prisma.rating.findMany({ where: { captainId }, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.rating.count({ where: { captainId } }),
  ]);

module.exports = {
  createTrip, findTripById, findTripsByUser,
  findTripsByCaptain, findNewRequests, updateTrip, recordDecline,
  createFareOffer, createRating, findRatingsByTrip, findCaptainRatings,
};
