const crypto = require('crypto');
const repo = require('./trips.repository');
const prisma = require('../../config/prisma');
const locationStore = require('../../realtime/locationStore');
const serviceRepo = require('../services/services.repository');
const regionsService = require('../regions/regions.service');
const locationUtils = require('../../utils/location');
const googleRoutesProvider = require('../../providers/googleRoutes');
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
const ACTIVE_SHAREABLE_STATUSES = ['matched', 'on_way', 'in_progress'];
const DEFAULT_SHARE_TOKEN_DURATION_MINUTES = 120;
const ROUTE_TOLL_PROXIMITY_KM = 0.15;

const normalizeStops = (stops = [], startOrder = 1) =>
  stops.map((stop, index) => ({
    order: startOrder + index,
    lat: Number(stop.lat),
    lng: Number(stop.lng),
    address: String(stop.address).trim(),
  }));

const getTripTollFeesTotal = (trip) =>
  roundMoney(
    (trip?.tollGates || []).reduce((sum, toll) => sum + Number(toll.fee || 0), 0)
  );

const parseRouteDurationSeconds = (durationValue) => {
  if (!durationValue || typeof durationValue !== 'string') {
    return null;
  }

  const durationMatch = /^([\d.]+)s$/.exec(durationValue);
  if (!durationMatch) return null;

  return Math.round(Number(durationMatch[1]));
};

const getTripWaypoints = ({ pickupLat, pickupLng, dropoffLat, dropoffLng, stops = [] }) => ({
  origin: {
    lat: Number(pickupLat),
    lng: Number(pickupLng),
  },
  destination: {
    lat: Number(dropoffLat),
    lng: Number(dropoffLng),
  },
  intermediates: stops.map((stop) => ({
    lat: Number(stop.lat),
    lng: Number(stop.lng),
  })),
});

const getActiveTollGates = () =>
  prisma.tollGate.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      lat: true,
      lng: true,
      fee: true,
      isActive: true,
    },
  });

const resolveRouteData = async ({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  stops = [],
}) => {
  const routeResponse = await googleRoutesProvider.computeDrivingRoute(
    getTripWaypoints({ pickupLat, pickupLng, dropoffLat, dropoffLng, stops })
  );

  const routeCoordinates = locationUtils.decodeEncodedPolyline(routeResponse.encodedPolyline);
  if (!routeCoordinates.length) {
    throw { status: 502, message: 'Unable to decode the route returned by Google Routes API' };
  }

  const activeTollGates = await getActiveTollGates();
  const matchedTollGates = activeTollGates
    .map((gate) => ({
      ...gate,
      distanceToRouteKm: locationUtils.distancePointToPolylineKm(
        { lat: Number(gate.lat), lng: Number(gate.lng) },
        routeCoordinates
      ),
    }))
    .filter((gate) => gate.distanceToRouteKm <= ROUTE_TOLL_PROXIMITY_KM)
    .sort((left, right) => left.distanceToRouteKm - right.distanceToRouteKm);

  const routeDistanceMeters = Number(routeResponse.distanceMeters || 0);
  const routeDurationSeconds = parseRouteDurationSeconds(routeResponse.duration);

  return {
    // routeEncodedPolyline: routeResponse.encodedPolyline,
    routeEncodedPolyline: routeResponse.encodedPolyline,
    routeCoordinates,
    routeDistanceMeters,
    routeDurationSeconds,
    distanceKm: routeDistanceMeters / 1000,
    matchedTollGates,
    tollFeesTotal: roundMoney(
      matchedTollGates.reduce((sum, gate) => sum + Number(gate.fee || 0), 0)
    ),
  };
};

const buildTripTollGatesCreate = (matchedTollGates = []) =>
  matchedTollGates.length
    ? {
        create: matchedTollGates.map((gate) => ({
          tollGate: { connect: { id: gate.id } },
          fee: Number(gate.fee),
        })),
      }
    : undefined;

const buildTripTollGatesUpdate = (matchedTollGates = []) => ({
  deleteMany: {},
  ...(matchedTollGates.length
    ? {
        create: matchedTollGates.map((gate) => ({
          tollGate: { connect: { id: gate.id } },
          fee: Number(gate.fee),
        })),
      }
    : {}),
});

const calculateTripPricing = async ({
  service,
  distanceKm,
  stops = [],
  tollFeesTotal = 0,
}) => {
  const driverEarnings = roundMoney(distanceKm * FARE_PER_KM);
  const { commission } = await commissionService.calculateCommission(driverEarnings);
  const fixedSurcharge = getFixedSurchargeAmount(service);
  const perStopSurcharge = getPerStopSurchargeAmount(service);
  const stopsSurcharge = roundMoney(stops.length * perStopSurcharge);
  const normalizedTollFeesTotal = roundMoney(tollFeesTotal);
  const originalFare = roundMoney(
    driverEarnings + commission + fixedSurcharge + stopsSurcharge + normalizedTollFeesTotal
  );

  return {
    distanceKm,
    driverEarnings,
    commission,
    fixedSurcharge,
    perStopSurcharge,
    stopsSurcharge,
    tollFeesTotal: normalizedTollFeesTotal,
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

const isTripShareable = (trip) =>
  Boolean(trip?.driverId) && ACTIVE_SHAREABLE_STATUSES.includes(trip.status);

const isShareTokenExpired = (trip) =>
  Boolean(trip?.shareTokenExpiresAt) && new Date(trip.shareTokenExpiresAt).getTime() <= Date.now();

const resolveShareTokenExpiry = (trip) => {
  if (trip?.endedAt) return new Date(trip.endedAt);
  if (trip?.cancelledAt) return new Date(trip.cancelledAt);

  const baseTime = trip?.startedAt ? new Date(trip.startedAt).getTime() : Date.now();
  const durationMinutes = Number(trip?.durationMinutes);
  const safeDurationMinutes =
    Number.isFinite(durationMinutes) && durationMinutes > 0
      ? durationMinutes
      : DEFAULT_SHARE_TOKEN_DURATION_MINUTES;

  return new Date(baseTime + safeDurationMinutes * 60 * 1000);
};

const getShareTrackingTarget = (trip) => {
  if (!trip) return null;

  if (trip.status === 'in_progress') {
    const nextStop = trip.stops.find((stop) => !stop.arrivedAt);
    if (nextStop) {
      return { lat: Number(nextStop.lat), lng: Number(nextStop.lng) };
    }

    return { lat: Number(trip.dropoffLat), lng: Number(trip.dropoffLng) };
  }

  return { lat: Number(trip.pickupLat), lng: Number(trip.pickupLng) };
};

const estimateShareEtaMinutes = (trip, driverLocation) => {
  if (driverLocation?.lat == null || driverLocation?.lng == null) {
    return trip.durationMinutes ?? null;
  }

  const target = getShareTrackingTarget(trip);
  if (!target) return trip.durationMinutes ?? null;

  const remainingDistanceKm = haversineKm(
    Number(driverLocation.lat),
    Number(driverLocation.lng),
    target.lat,
    target.lng,
  );

  const averageSpeedKmPerMinute = 0.5; // Rough city-driving estimate (~30 km/h).
  return Math.max(1, Math.round(remainingDistanceKm / averageSpeedKmPerMinute));
};

const buildPublicSharedTripPayload = (trip) => {
  const driverLocation = trip.driverId ? locationStore.get(trip.driverId) : null;

  return {
    driverLocation: driverLocation
      ? {
          latitude: driverLocation.lat,
          longitude: driverLocation.lng,
          heading: driverLocation.heading ?? null,
        }
      : null,
    pickupAddress: trip.pickupAddress,
    dropoffAddress: trip.dropoffAddress,
    status: trip.status,
    etaMinutes: estimateShareEtaMinutes(trip, driverLocation),
  };
};

const generateUniqueShareToken = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = crypto.randomBytes(24).toString('hex');
    const existing = await repo.findTripByShareToken(candidate);
    if (!existing) return candidate;
  }

  throw { status: 500, message: 'Unable to generate a unique share token right now' };
};

const estimateFare = async ({ pickupLat, pickupLng, dropoffLat, dropoffLng, stops = [] }) => {
  const normalizedStops = normalizeStops(stops);
  const routeData = await resolveRouteData({
    pickupLat,
    pickupLng,
    dropoffLat,
    dropoffLng,
    stops: normalizedStops,
  });
  const services = await serviceRepo.findAll();
  const estimates = await Promise.all(
    services.map(async (service) => {
      const pricing = await calculateTripPricing({
        service,
        distanceKm: routeData.distanceKm,
        stops: normalizedStops,
        tollFeesTotal: routeData.tollFeesTotal,
      });

      return {
        serviceId:     service.id,
        serviceName:   service.name,
        distanceKm:    +pricing.distanceKm.toFixed(2),
        farePerKm:     FARE_PER_KM,
        fixedSurcharge: pricing.fixedSurcharge,
        perStopSurcharge: pricing.perStopSurcharge,
        stopsCount: normalizedStops.length,
        stopsSurcharge: pricing.stopsSurcharge,
        tollFees: pricing.tollFeesTotal,
        originalFare: pricing.originalFare,
        finalFare: pricing.finalFare,
        discountAmount: pricing.discountAmount,
        commission: pricing.commission,
        driverEarnings: pricing.driverEarnings,
        routeDistanceMeters: routeData.routeDistanceMeters,
        routeDurationSeconds: routeData.routeDurationSeconds,
        tollGatesCount: routeData.matchedTollGates.length,
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
const getNearbyDrivers = (pickupLat, pickupLng, radiusKm = 10, serviceId = null) =>
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
    service_id,
    stops = [],
  } = body;

  const svc = await serviceRepo.findById(service_id);
  if (!svc || !svc.isActive) throw Object.assign(new Error('Service not found or inactive'), { statusCode: 404 });

  await validatePickupInRegion(pickup_lat, pickup_lng);

  const normalizedStops = normalizeStops(stops);
  const routeData = await resolveRouteData({
    pickupLat: pickup_lat,
    pickupLng: pickup_lng,
    dropoffLat: dropoff_lat,
    dropoffLng: dropoff_lng,
    stops: normalizedStops,
  });
  const pricing = await calculateTripPricing({
    service: svc,
    distanceKm: routeData.distanceKm,
    stops: normalizedStops,
    tollFeesTotal: routeData.tollFeesTotal,
  });

  const trip = await repo.createTrip({
    user:          { connect: { id: userId } },
    service:       { connect: { id: service_id } },
    pickupLat:      pickup_lat,
    pickupLng:      pickup_lng,
    pickupAddress:  pickup_address,
    dropoffLat:     dropoff_lat,
    dropoffLng:     dropoff_lng,
    dropoffAddress: dropoff_address,
    routeEncodedPolyline: routeData.routeEncodedPolyline,
    routeDistanceMeters: routeData.routeDistanceMeters || null,
    routeDurationSeconds: routeData.routeDurationSeconds,
    distanceKm:     +pricing.distanceKm.toFixed(2),
    durationMinutes: routeData.routeDurationSeconds == null
      ? null
      : Math.max(1, Math.round(routeData.routeDurationSeconds / 60)),
    finalFare:      pricing.finalFare,
    originalFare:   pricing.originalFare,
    discountAmount: 0,
    commission:     pricing.commission,
    driverEarnings: pricing.driverEarnings,
    paymentType:    'cash',
    status:         'searching',
    tollGates: buildTripTollGatesCreate(routeData.matchedTollGates),
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

const getTripRouteById = async (id, actorId) => {
  const trip = await getTripById(id, actorId);
  
  if (!trip.routeEncodedPolyline) {
    throw { status: 404, message: 'Route data is not available for this trip' };
  }

  return {
    id: trip.id,
    status: trip.status,
    service: trip.service,
    pickup: {
      lat: Number(trip.pickupLat),
      lng: Number(trip.pickupLng),
      address: trip.pickupAddress,
    },
    dropoff: {
      lat: Number(trip.dropoffLat),
      lng: Number(trip.dropoffLng),
      address: trip.dropoffAddress,
    },
    stops: trip.stops.map((stop) => ({
      id: stop.id,
      order: stop.order,
      lat: Number(stop.lat),
      lng: Number(stop.lng),
      address: stop.address,
      arrivedAt: stop.arrivedAt,
    })),
    tollFeesTotal: getTripTollFeesTotal(trip),
    tollGates: trip.tollGates,
    finalFare: trip.finalFare,
    originalFare: trip.originalFare,
    distanceKm: trip.distanceKm,
    durationMinutes: trip.durationMinutes,
    route: {
      encodedPolyline: trip.routeEncodedPolyline,
      distanceMeters: trip.routeDistanceMeters,
      durationSeconds: trip.routeDurationSeconds,
      coordinates: locationUtils.decodeEncodedPolyline(trip.routeEncodedPolyline),
    },
  };
};

const getUserTrips = async (userId, page = 1, perPage = 20) => {
  const skip = (page - 1) * perPage;
  const [trips, total] = await repo.findTripsByUser(userId, skip, perPage);
  return { trips, total, page, perPage };
};

const getAdminTrips = async ({
  page = 1,
  perPage = 20,
  status,
  userId,
  driverId,
  serviceId,
  dateFrom,
  dateTo,
  search,
} = {}) => {
  const where = {};

  if (status && status !== 'all') where.status = status;
  if (userId) where.userId = userId;
  if (driverId) where.driverId = driverId;
  if (serviceId) where.serviceId = serviceId;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }
  if (search) {
    where.OR = [
      { pickupAddress: { contains: search } },
      { dropoffAddress: { contains: search } },
      { user: { name: { contains: search } } },
      { user: { email: { contains: search } } },
      { driver: { name: { contains: search } } },
      { driver: { email: { contains: search } } },
    ];
  }

  const skip = (page - 1) * perPage;
  const [trips, total] = await repo.findTrips({ where, skip, take: perPage });
  return { trips, total, page, perPage };
};

const getAdminTripById = async (id) => {
  const trip = await repo.findTripById(id);
  if (!trip) throw { status: 404, message: 'Trip not found' };
  return trip;
};

const addTripStops = async (tripId, userId, stops) => {
  const trip = await repo.findTripById(tripId);
  assertStopsCanBeModified(trip, userId);

  const newStops = normalizeStops(stops, trip.stops.length + 1);
  const allStops = [...trip.stops, ...newStops];
  const routeData = await resolveRouteData({
    pickupLat: trip.pickupLat,
    pickupLng: trip.pickupLng,
    dropoffLat: trip.dropoffLat,
    dropoffLng: trip.dropoffLng,
    stops: allStops,
  });
  const pricing = await calculateTripPricing({
    service: trip.service,
    distanceKm: routeData.distanceKm,
    stops: allStops,
    tollFeesTotal: routeData.tollFeesTotal,
  });
  const fareData = await recalculateCouponFare(trip, pricing.originalFare);

  return repo.updateTrip(tripId, {
    routeEncodedPolyline: routeData.routeEncodedPolyline,
    routeDistanceMeters: routeData.routeDistanceMeters || null,
    routeDurationSeconds: routeData.routeDurationSeconds,
    distanceKm: +pricing.distanceKm.toFixed(2),
    durationMinutes: routeData.routeDurationSeconds == null
      ? null
      : Math.max(1, Math.round(routeData.routeDurationSeconds / 60)),
    originalFare: fareData.originalFare,
    finalFare: fareData.finalFare,
    discountAmount: fareData.discountAmount,
    commission: pricing.commission,
    driverEarnings: pricing.driverEarnings,
    tollGates: buildTripTollGatesUpdate(routeData.matchedTollGates),
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

const generateTripShareLink = async (tripId, userId) => {
  const trip = await repo.findTripById(tripId);
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.userId !== userId) throw { status: 403, message: 'Access denied' };
  if (!isTripShareable(trip)) {
    throw { status: 422, message: 'Trip sharing is only available for active trips with an assigned driver' };
  }

  const shareToken = await generateUniqueShareToken();
  const shareTokenExpiresAt = resolveShareTokenExpiry(trip);

  return repo.updateTrip(tripId, { shareToken, shareTokenExpiresAt });
};

const getSharedTrip = async (shareToken) => {
  const trip = await repo.findTripByShareToken(shareToken);
  if (!trip) throw { status: 404, message: 'Shared trip not found' };
  if (isShareTokenExpired(trip)) throw { status: 410, message: 'This shared trip link has expired' };
  if (!isTripShareable(trip)) throw { status: 410, message: 'This shared trip is no longer active' };

  return buildPublicSharedTripPayload(trip);
};

const resolveShareTokenSocketContext = async (shareToken) => {
  const trip = await repo.findTripShareSocketContextByToken(shareToken);
  if (!trip || !trip.driverId) return null;
  if (isShareTokenExpired(trip)) return null;
  if (!ACTIVE_SHAREABLE_STATUSES.includes(trip.status)) return null;

  return trip;
};

// ─────────────────────────────────────────────────────────────────────────────
//  CANCEL TRIP (Customer)
// ─────────────────────────────────────────────────────────────────────────────
const cancelTrip = async (tripId, userId) => {
  const trip = await repo.findTripById(tripId);
  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.userId !== userId) throw { status: 403, message: 'Access denied' };
  if (['completed', 'cancelled'].includes(trip.status)) throw { status: 422, message: 'Trip cannot be cancelled' };

  const cancelledAt = new Date();
  const updated = await repo.updateTrip(tripId, {
    status: 'cancelled',
    cancelledAt,
    cancelledBy: userId,
    shareTokenExpiresAt: cancelledAt,
  });

  return updated;
};

// ─────────────────────────────────────────────────────────────────────────────
//  DRIVER ACTIONS
// ─────────────────────────────────────────────────────────────────────────────
const getDriverTrips = async (driverId, page = 1, perPage = 20) => {
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

  await prisma.driverProfile.upsert({
    where: { userId: driverId },
    create: { userId: driverId, totalTrips: 1 },
    update: { totalTrips: { increment: 1 } },
  });

  const endedAt = new Date();
  const completed = await repo.updateTrip(tripId, {
    status: 'completed',
    endedAt,
    shareTokenExpiresAt: endedAt,
  });

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
    // Cash is the only supported payment type, so drivers always settle the platform cut in-wallet.
    await walletsRepo.adjustUserWallet(driverId, -commission, {
      reason: 'trip_commission_deduction',
      tripId,
    });

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
      paymentType: 'cash',
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
  if (!trip.driverId) throw { status: 422, message: 'Trip has no assigned driver to rate' };

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
  await prisma.driverProfile.upsert({
    where: { userId: trip.driverId },
    create: { userId: trip.driverId, rating: allRatings._avg.stars || 0 },
    update: { rating: allRatings._avg.stars || 0 },
  });

  return rating;
};

const getDriverRatings = async (driverId, page = 1, perPage = 20) => {
  const skip = (page - 1) * perPage;
  const [ratings, total] = await repo.findDriverRatings(driverId, skip, perPage);
  return { ratings, total, page, perPage };
};

module.exports = {
  estimateFare, getNearbyDrivers, createTrip, getTripById, getTripRouteById, getUserTrips, getAdminTrips,
  getAdminTripById, addTripStops, cancelTrip,
  getDriverTrips, getNewRequests, acceptTrip, declineTrip, startTrip, markStopArrived, endTrip,
  rateTrip, getDriverRatings, generateTripShareLink, getSharedTrip, resolveShareTokenSocketContext,
};
