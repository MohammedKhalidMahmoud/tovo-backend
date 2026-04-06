const repo = require('./trips.repository');
const prisma = require('../../config/prisma');
const locationStore = require('../../realtime/locationStore');
const serviceRepo = require('../services/services.repository');
const regionsService = require('../regions/regions.service');
const locationUtils = require('../../utils/location');
const commissionService = require('../commission-rules/commission-rules.service');
const commissionRepo = require('../earnings/earnings.repository');
const walletsRepo = require('../wallets/wallets.repository');
const notificationsService = require('../notifications/notifications.service');

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
const FARE_PER_KM = Number(process.env.FARE_PER_KM) || 5.0;
const roundMoney = (value) => +Number(value).toFixed(2);
const getFixedSurchargeAmount = (service) => roundMoney(service?.fixedSurcharge ?? 0);

const estimateFare = async ({ pickupLat, pickupLng, dropoffLat, dropoffLng }) => {
  const distanceKm = haversineKm(pickupLat, pickupLng, dropoffLat, dropoffLng);

  const services = await serviceRepo.findAll();
  const estimates = await Promise.all(
    services.map(async (service) => {
      const driverEarnings = roundMoney(distanceKm * FARE_PER_KM);
      const { commission } = await commissionService.calculateCommission(driverEarnings);
      const fixedSurcharge = getFixedSurchargeAmount(service);
      const originalFare = roundMoney(driverEarnings + commission + fixedSurcharge);

      return {
        serviceId:     service.id,
        serviceName:   service.name,
        distanceKm:    +distanceKm.toFixed(2),
        farePerKm:     FARE_PER_KM,
        fixedSurcharge,
        originalFare,
        finalFare:     originalFare,
        discountAmount: 0,
        commission,
        driverEarnings,
        currency:      'EGP',
      };
    })
  );

  return estimates;
};

// ─────────────────────────────────────────────────────────────────────────────
//  REGION VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
const validatePickupInRegion = async (pickupLat, pickupLng) => {
  const activeRegions = await regionsService.listActiveRegions();

  if (!activeRegions || activeRegions.length === 0) return true;

  const matchingRegion = locationUtils.findPointInRegions(pickupLat, pickupLng, activeRegions);
  if (!matchingRegion) {
    throw Object.assign(
      new Error('Pickup location is outside all service regions. Please select a location within the service area.'),
      { statusCode: 422 }
    );
  }

  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
//  NEARBY DRIVERS
// ─────────────────────────────────────────────────────────────────────────────
const getNearbyCaptains = (pickupLat, pickupLng, radiusKm = 10, serviceId = null) =>
  locationStore.getNearby(pickupLat, pickupLng, radiusKm, serviceId);

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE TRIP
// ─────────────────────────────────────────────────────────────────────────────
const createTrip = async (userId, body) => {
  const { pickup_lat, pickup_lng, pickup_address, dropoff_lat, dropoff_lng, dropoff_address, payment_type, payment_method_id, service_id } = body;

  const svc = await serviceRepo.findById(service_id);
  if (!svc || !svc.isActive) throw Object.assign(new Error('Service not found or inactive'), { statusCode: 404 });

  // payment_method_id is optional; no validation required here

  await validatePickupInRegion(pickup_lat, pickup_lng);

  const distanceKm     = haversineKm(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng);
  const driverEarnings = roundMoney(distanceKm * FARE_PER_KM);
  const { commission } = await commissionService.calculateCommission(driverEarnings);
  const fixedSurcharge = getFixedSurchargeAmount(svc);
  const originalFare   = roundMoney(driverEarnings + commission + fixedSurcharge);

  const trip = await repo.createTrip({
    user:          { connect: { id: userId } },
    service:       { connect: { id: service_id } },
    paymentMethod: payment_method_id ? { connect: { id: payment_method_id } } : undefined,
    pickupLat:      pickup_lat,
    pickupLng:      pickup_lng,
    pickupAddress:  pickup_address,
    dropoffLat:     dropoff_lat,
    dropoffLng:     dropoff_lng,
    dropoffAddress: dropoff_address,
    distanceKm:     +distanceKm.toFixed(2),
    finalFare:      originalFare,
    originalFare,
    discountAmount: 0,
    commission,
    driverEarnings,
    paymentType:    payment_type,
    status:         'searching',
  });

  return trip;
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET TRIPS
// ─────────────────────────────────────────────────────────────────────────────
const getTripById = async (id, actorId) => {
  const trip = await repo.findTripById(id);
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.userId !== actorId && trip.driverId !== actorId) throw { status: 403, message: 'Access denied' };
  return trip;
};

const getUserTrips = async (userId, page = 1, perPage = 20) => {
  const skip = (page - 1) * perPage;
  const [trips, total] = await repo.findTripsByUser(userId, skip, perPage);
  return { trips, total, page, perPage };
};

// ─────────────────────────────────────────────────────────────────────────────
//  CANCEL TRIP (Customer)
// ─────────────────────────────────────────────────────────────────────────────
const cancelTrip = async (tripId, userId) => {
  const trip = await repo.findTripById(tripId);
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.userId !== userId) throw { status: 403, message: 'Access denied' };
  if (['completed', 'cancelled'].includes(trip.status)) throw { status: 422, message: 'Trip cannot be cancelled' };

  const updated = await repo.updateTrip(tripId, { status: 'cancelled', cancelledAt: new Date(), cancelledBy: userId });

  return updated;
};

// ─────────────────────────────────────────────────────────────────────────────
//  DRIVER ACTIONS
// ─────────────────────────────────────────────────────────────────────────────
const getCaptainTrips = async (driverId, page = 1, perPage = 20) => {
  const skip = (page - 1) * perPage;
  const [trips, total] = await repo.findTripsByDriver(driverId, skip, perPage);
  return { trips, total, page, perPage };
};

const getNewRequests = (driverId) => repo.findNewRequests(driverId);

const acceptTrip = async (tripId, driverId) => {
  const trip = await repo.findTripById(tripId);
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.status !== 'searching') throw { status: 422, message: 'Trip is no longer available' };

  const updated = await repo.updateTrip(tripId, { driverId, status: 'matched' });

  return updated;
};

const declineTrip = async (tripId, driverId) => {
  const trip = await repo.findTripById(tripId);
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.status !== 'searching') throw { status: 422, message: 'Trip is no longer available' };

  await repo.recordDecline(tripId, driverId);
};

const startTrip = async (tripId, driverId) => {
  const trip = await repo.findTripById(tripId);
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.driverId !== driverId) throw { status: 403, message: 'Access denied' };
  if (trip.status !== 'matched' && trip.status !== 'on_way') throw { status: 422, message: 'Trip cannot be started' };

  const updated = await repo.updateTrip(tripId, { status: 'in_progress', startedAt: new Date() });

  return updated;
};

const endTrip = async (tripId, driverId) => {
  const trip = await repo.findTripById(tripId);
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.driverId !== driverId) throw { status: 403, message: 'Access denied' };
  if (trip.status !== 'in_progress') throw { status: 422, message: 'Trip is not in progress' };

  await prisma.user.update({ where: { id: driverId }, data: { totalTrips: { increment: 1 } } });

  const completed = await repo.updateTrip(tripId, { status: 'completed', endedAt: new Date() });

  if (trip.couponId) {
    await prisma.coupon.update({
      where: { id: trip.couponId },
      data: { used_count: { increment: 1 } },
    });
  }

  const commission = trip.commission !== null ? Number(trip.commission) : null;
  const driverEarnings = trip.driverEarnings !== null ? Number(trip.driverEarnings) : null;
  const discountAmount = Number(trip.discountAmount ?? 0);

  // Stored commission and driver earnings are based on originalFare, not the discounted finalFare.
  if (commission !== null && driverEarnings !== null) {
    if (trip.paymentType === 'cash') {
      // Driver collected the discounted cash fare directly, so only settle the platform cut in-wallet.
      await walletsRepo.adjustUserWallet(driverId, -commission, {
        reason: 'trip_commission_deduction',
        tripId,
      });
    } else {
      await walletsRepo.adjustUserWallet(driverId, +driverEarnings, {
        reason: 'trip_earnings_credit',
        tripId,
      });
    }

    if (discountAmount > 0) {
      await walletsRepo.adjustUserWallet(driverId, +discountAmount, {
        reason: 'trip_coupon_reimbursement',
        tripId,
      });
    }
  }

  // Log platform commission earned
  if (trip.commission && parseFloat(trip.commission) > 0) {
    await commissionRepo.createCommissionLog({
      tripId: trip.id,
      amount: trip.commission,
      paymentType: trip.paymentType ?? 'cash',
      serviceId: trip.serviceId ?? null,
    });
  }

  return completed;
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

  const rating = await repo.createRating({ tripId, userId, driverId: trip.driverId, stars, comment });

  notificationsService.sendToDriver(
    trip.driverId,
    'New Rating',
    `You received a ${stars}⭐ rating from a passenger`,
    { type: 'trip_rated', tripId, stars: String(stars) }
  ).catch(() => {});

  const allRatings = await prisma.rating.aggregate({ where: { driverId: trip.driverId }, _avg: { stars: true } });
  await prisma.user.update({ where: { id: trip.driverId }, data: { rating: allRatings._avg.stars || 0 } });

  return rating;
};

const getCaptainRatings = async (driverId, page = 1, perPage = 20) => {
  const skip = (page - 1) * perPage;
  const [ratings, total] = await repo.findDriverRatings(driverId, skip, perPage);
  return { ratings, total, page, perPage };
};

module.exports = {
  estimateFare, getNearbyCaptains, createTrip, getTripById, getUserTrips, cancelTrip,
  getCaptainTrips, getNewRequests, acceptTrip, declineTrip, startTrip, endTrip,
  rateTrip, getCaptainRatings,
};
