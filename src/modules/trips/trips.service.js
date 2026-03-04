const repo = require('./trips.repository');
const prisma = require('../../config/prisma');
const locationStore = require('../../realtime/locationStore');
const serviceRepo = require('../services/services.repository');
const regionsService = require('../regions/regions.service');
const locationUtils = require('../../utils/location');

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─────────────────────────────────────────────────────────────────────────────
//  FARE ESTIMATE
// ─────────────────────────────────────────────────────────────────────────────
const FARE_PER_KM    = Number(process.env.FARE_PER_KM)    || 5.0;
const COMMISSION_PCT = Number(process.env.COMMISSION_PCT) || 15;

const estimateFare = async ({ pickupLat, pickupLng, dropoffLat, dropoffLng, serviceId }) => {
  const distanceKm = haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng);

  let baseFare = 0;
  let serviceName = null;
  if (serviceId) {
    const svc = await serviceRepo.findById(serviceId);
    if (!svc || !svc.isActive) throw Object.assign(new Error('Service not found or inactive'), { statusCode: 404 });
    baseFare = parseFloat(svc.baseFare);
    serviceName = svc.name;
  }

  const tripFare   = +(baseFare + distanceKm * FARE_PER_KM).toFixed(2);
  const commission = +(tripFare * COMMISSION_PCT / 100).toFixed(2);
  const totalFare  = +(tripFare + commission).toFixed(2);

  return {
    distanceKm:    +distanceKm.toFixed(2),
    farePerKm:     FARE_PER_KM,
    baseFare,
    serviceName,
    tripFare,
    commissionPct: COMMISSION_PCT,
    commission,
    totalFare,
    currency:      'EGP',
  };
};

// ─────────────────────────────────────────────────────────────────────────────
//  REGION VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
const validatePickupInRegion = async (pickupLat, pickupLng) => {
  const activeRegions = await regionsService.listActiveRegions();
  
  // If no regions are defined, allow the trip (backward compatibility)
  if (!activeRegions || activeRegions.length === 0) {
    return true;
  }

  // Check if pickup location is within any active region
  const matchingRegion = locationUtils.findPointInRegions(pickupLat, pickupLng, activeRegions);
  
  if (!matchingRegion) {
    throw Object.assign(
      new Error(
        `Pickup location is outside all service regions. Please select a location within the service area.`
      ),
      { statusCode: 422 }
    );
  }

  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
//  NEARBY CAPTAINS  (used by controller after trip creation)
//  Reads from the in-memory locationStore — zero DB I/O, synchronous.
// ─────────────────────────────────────────────────────────────────────────────
const getNearbyCaptains = (pickupLat, pickupLng, radiusKm = 10, serviceId = null) =>
  locationStore.getNearby(pickupLat, pickupLng, radiusKm, serviceId);

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE TRIP
// ─────────────────────────────────────────────────────────────────────────────
const createTrip = async (userId, body) => {
  const { pickup_lat, pickup_lng, pickup_address, dropoff_lat, dropoff_lng, dropoff_address, payment_method_id, service_id } = body;

  // Validate service
  const svc = await serviceRepo.findById(service_id);
  if (!svc || !svc.isActive) throw Object.assign(new Error('Service not found or inactive'), { statusCode: 404 });

  // Validate pickup location is within a service region
  await validatePickupInRegion(pickup_lat, pickup_lng);

  const distanceKm = haversineKm(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng);
  const baseFare   = parseFloat(svc.baseFare);
  const tripFare   = +(baseFare + distanceKm * FARE_PER_KM).toFixed(2);
  const commission = +(tripFare * COMMISSION_PCT / 100).toFixed(2);
  const fare       = +(tripFare + commission).toFixed(2); // total charged to user

  return repo.createTrip({
    user: { connect: { id: userId } },
    service: { connect: { id: service_id } },
    paymentMethod: payment_method_id ? { connect: { id: payment_method_id } } : undefined,
    pickupLat: pickup_lat,
    pickupLng: pickup_lng,
    pickupAddress: pickup_address,
    dropoffLat: dropoff_lat,
    dropoffLng: dropoff_lng,
    dropoffAddress: dropoff_address,
    distanceKm: +distanceKm.toFixed(2),
    fare,
    status: 'searching',
  });
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET TRIP
// ─────────────────────────────────────────────────────────────────────────────
const getTripById = async (id, actorId) => {
  const trip = await repo.findTripById(id);
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.userId !== actorId && trip.captainId !== actorId) throw { status: 403, message: 'Access denied' };
  return trip;
};

const getUserTrips = async (userId, page = 1, perPage = 20) => {
  const skip = (page - 1) * perPage;
  const [trips, total] = await repo.findTripsByUser(userId, skip, perPage);
  return { trips, total, page, perPage };
};

// ─────────────────────────────────────────────────────────────────────────────
//  CANCEL TRIP (User)
// ─────────────────────────────────────────────────────────────────────────────
const cancelTrip = async (tripId, userId) => {
  const trip = await repo.findTripById(tripId);
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.userId !== userId) throw { status: 403, message: 'Access denied' };
  if (['completed', 'cancelled'].includes(trip.status)) throw { status: 422, message: 'Trip cannot be cancelled' };

  return repo.updateTrip(tripId, { status: 'cancelled', cancelledAt: new Date(), cancelledBy: userId });
};

// ─────────────────────────────────────────────────────────────────────────────
//  CAPTAIN ACTIONS
// ─────────────────────────────────────────────────────────────────────────────
const getCaptainTrips = async (captainId, page = 1, perPage = 20) => {
  const skip = (page - 1) * perPage;
  const [trips, total] = await repo.findTripsByCaptain(captainId, skip, perPage);
  return { trips, total, page, perPage };
};

const getNewRequests = (captainId) => repo.findNewRequests(captainId);

const acceptTrip = async (tripId, captainId) => {
  const trip = await repo.findTripById(tripId);
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.status !== 'searching') throw { status: 422, message: 'Trip is no longer available' };

  return repo.updateTrip(tripId, { captainId, status: 'matched' });
};

const declineTrip = async (tripId, captainId) => {
  const trip = await repo.findTripById(tripId);
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.status !== 'searching') throw { status: 422, message: 'Trip is no longer available' };

  await repo.recordDecline(tripId, captainId);
};

const startTrip = async (tripId, captainId) => {
  const trip = await repo.findTripById(tripId);
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.captainId !== captainId) throw { status: 403, message: 'Access denied' };
  if (trip.status !== 'matched' && trip.status !== 'on_way') throw { status: 422, message: 'Trip cannot be started' };

  return repo.updateTrip(tripId, { status: 'in_progress', startedAt: new Date() });
};

const endTrip = async (tripId, captainId) => {
  const trip = await repo.findTripById(tripId);
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.captainId !== captainId) throw { status: 403, message: 'Access denied' };
  if (trip.status !== 'in_progress') throw { status: 422, message: 'Trip is not in progress' };

  await prisma.captain.update({ where: { id: captainId }, data: { totalTrips: { increment: 1 } } });

  return repo.updateTrip(tripId, { status: 'completed', endedAt: new Date() });
};

// ─────────────────────────────────────────────────────────────────────────────
//  RATINGS
// ─────────────────────────────────────────────────────────────────────────────
const rateTrip = async (tripId, userId, stars, comment) => {
  const trip = await repo.findTripById(tripId);
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.userId !== userId) throw { status: 403, message: 'Access denied' };
  if (trip.status !== 'completed') throw { status: 422, message: 'Can only rate completed trips' };

  const existing = await repo.findRatingsByTrip(tripId);
  if (existing) throw { status: 409, message: 'Trip already rated' };

  const rating = await repo.createRating({ tripId, userId, captainId: trip.captainId, stars, comment });

  const allRatings = await prisma.rating.aggregate({ where: { captainId: trip.captainId }, _avg: { stars: true } });
  await prisma.captain.update({ where: { id: trip.captainId }, data: { rating: allRatings._avg.stars || 0 } });

  return rating;
};

const getCaptainRatings = async (captainId, page = 1, perPage = 20) => {
  const skip = (page - 1) * perPage;
  const [ratings, total] = await repo.findCaptainRatings(captainId, skip, perPage);
  return { ratings, total, page, perPage };
};

module.exports = {
  estimateFare, getNearbyCaptains, createTrip, getTripById, getUserTrips, cancelTrip,
  getCaptainTrips, getNewRequests, acceptTrip, declineTrip, startTrip, endTrip,
  rateTrip, getCaptainRatings,
};
