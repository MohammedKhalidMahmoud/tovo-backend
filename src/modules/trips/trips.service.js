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
const getPerStopSurchargeAmount = (service) => roundMoney(service?.perStopSurcharge ?? 0);
const ACTIVE_PRE_START_STATUSES = ['searching', 'matched', 'on_way'];

const normalizeStops = (stops = [], startOrder = 1) =>
  stops.map((stop, index) => ({
    order: startOrder + index,
    lat: Number(stop.lat),
    lng: Number(stop.lng),
    address: String(stop.address).trim(),
  }));

const calculateRouteDistanceKm = ({ pickupLat, pickupLng, dropoffLat, dropoffLng, stops = [] }) => {
  const routePoints = [
    { lat: pickupLat, lng: pickupLng },
    ...stops.map((stop) => ({ lat: Number(stop.lat), lng: Number(stop.lng) })),
    { lat: dropoffLat, lng: dropoffLng },
  ];

  let totalDistanceKm = 0;
  for (let i = 0; i < routePoints.length - 1; i += 1) {
    totalDistanceKm += haversineKm(
      routePoints[i].lat,
      routePoints[i].lng,
      routePoints[i + 1].lat,
      routePoints[i + 1].lng,
    );
  }

  return totalDistanceKm;
};

const calculateTripPricing = async ({
  service,
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  stops = [],
}) => {
  const distanceKm = calculateRouteDistanceKm({
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
    stops,
  });

  const driverEarnings = roundMoney(distanceKm * FARE_PER_KM);
  const { commission } = await commissionService.calculateCommission(driverEarnings);
  const fixedSurcharge = getFixedSurchargeAmount(service);
  const perStopSurcharge = getPerStopSurchargeAmount(service);
  const stopsSurcharge = roundMoney(stops.length * perStopSurcharge);
  const originalFare = roundMoney(driverEarnings + commission + fixedSurcharge + stopsSurcharge);

  return {
    distanceKm,
    driverEarnings,
    commission,
    fixedSurcharge,
    perStopSurcharge,
    stopsSurcharge,
    originalFare,
    finalFare: originalFare,
    discountAmount: 0,
  };
};

const recalculateCouponFare = async (trip, originalFare) => {
  if (!trip.couponId) {
    return {
      originalFare,
      finalFare: originalFare,
      discountAmount: 0,
    };
  }

  const coupon = await prisma.coupon.findUnique({ where: { id: trip.couponId } });
  if (!coupon) {
    throw { status: 422, message: 'Applied coupon is no longer available' };
  }

  let discountAmount =
    coupon.discount_type === 'percentage'
      ? (originalFare * Number(coupon.discount ?? 0)) / 100
      : Number(coupon.discount ?? 0);

  if (coupon.max_discount != null) {
    discountAmount = Math.min(discountAmount, Number(coupon.max_discount));
  }

  discountAmount = roundMoney(Math.max(0, Math.min(discountAmount, originalFare)));
  const finalFare = roundMoney(originalFare - discountAmount);

  return {
    originalFare,
    finalFare,
    discountAmount,
  };
};

const assertStopsCanBeModified = (trip, userId) => {
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.userId !== userId) throw { status: 403, message: 'Access denied' };
  if (trip.startedAt || !ACTIVE_PRE_START_STATUSES.includes(trip.status)) {
    throw { status: 422, message: 'Stops can only be added before the trip starts' };
  }
};

const estimateFare = async ({ pickupLat, pickupLng, dropoffLat, dropoffLng, stops = [] }) => {
  const services = await serviceRepo.findAll();
  const estimates = await Promise.all(
    services.map(async (service) => {
      const pricing = await calculateTripPricing({
        service,
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng,
        stops,
      });

      return {
        serviceId:     service.id,
        serviceName:   service.name,
        distanceKm:    +pricing.distanceKm.toFixed(2),
        farePerKm:     FARE_PER_KM,
        fixedSurcharge: pricing.fixedSurcharge,
        perStopSurcharge: pricing.perStopSurcharge,
        stopsCount: stops.length,
        stopsSurcharge: pricing.stopsSurcharge,
        originalFare: pricing.originalFare,
        finalFare: pricing.finalFare,
        discountAmount: pricing.discountAmount,
        commission: pricing.commission,
        driverEarnings: pricing.driverEarnings,
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
  const {
    pickup_lat,
    pickup_lng,
    pickup_address,
    dropoff_lat,
    dropoff_lng,
    dropoff_address,
    payment_type,
    payment_method_id,
    service_id,
    stops = [],
  } = body;

  const svc = await serviceRepo.findById(service_id);
  if (!svc || !svc.isActive) throw Object.assign(new Error('Service not found or inactive'), { statusCode: 404 });

  // payment_method_id is optional; no validation required here

  await validatePickupInRegion(pickup_lat, pickup_lng);

  const normalizedStops = normalizeStops(stops);
  const pricing = await calculateTripPricing({
    service: svc,
    pickupLat: pickup_lat,
    pickupLng: pickup_lng,
    dropoffLat: dropoff_lat,
    dropoffLng: dropoff_lng,
    stops: normalizedStops,
  });

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
    distanceKm:     +pricing.distanceKm.toFixed(2),
    finalFare:      pricing.finalFare,
    originalFare:   pricing.originalFare,
    discountAmount: 0,
    commission:     pricing.commission,
    driverEarnings: pricing.driverEarnings,
    paymentType:    payment_type,
    status:         'searching',
    stops: normalizedStops.length
      ? {
          create: normalizedStops.map((stop) => ({
            order: stop.order,
            lat: stop.lat,
            lng: stop.lng,
            address: stop.address,
          })),
        }
      : undefined,
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

const addTripStops = async (tripId, userId, stops) => {
  const trip = await repo.findTripById(tripId);
  assertStopsCanBeModified(trip, userId);

  const newStops = normalizeStops(stops, trip.stops.length + 1);
  const allStops = [...trip.stops, ...newStops];
  const pricing = await calculateTripPricing({
    service: trip.service,
    pickupLat: trip.pickupLat,
    pickupLng: trip.pickupLng,
    dropoffLat: trip.dropoffLat,
    dropoffLng: trip.dropoffLng,
    stops: allStops,
  });
  const fareData = await recalculateCouponFare(trip, pricing.originalFare);

  return repo.updateTrip(tripId, {
    distanceKm: +pricing.distanceKm.toFixed(2),
    originalFare: fareData.originalFare,
    finalFare: fareData.finalFare,
    discountAmount: fareData.discountAmount,
    commission: pricing.commission,
    driverEarnings: pricing.driverEarnings,
    stops: {
      create: newStops.map((stop) => ({
        order: stop.order,
        lat: stop.lat,
        lng: stop.lng,
        address: stop.address,
      })),
    },
  });
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

const markStopArrived = async (tripId, stopId, driverId) => {
  const trip = await repo.findTripById(tripId);
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.driverId !== driverId) throw { status: 403, message: 'Access denied' };
  if (trip.status !== 'in_progress') throw { status: 422, message: 'Trip is not in progress' };

  const stop = trip.stops.find((item) => item.id === stopId);
  if (!stop) throw { status: 404, message: 'Stop not found' };
  if (stop.arrivedAt) return trip;

  const nextPendingStop = trip.stops.find((item) => !item.arrivedAt);
  if (nextPendingStop && nextPendingStop.id !== stopId) {
    throw { status: 422, message: 'Stops must be marked in order' };
  }

  await repo.updateTripStop(tripId, stopId, { arrivedAt: new Date() });
  return repo.findTripById(tripId);
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
  estimateFare, getNearbyCaptains, createTrip, getTripById, getUserTrips, addTripStops, cancelTrip,
  getCaptainTrips, getNewRequests, acceptTrip, declineTrip, startTrip, markStopArrived, endTrip,
  rateTrip, getCaptainRatings,
};
