const service = require('./trips.service');
const regionsService = require('../regions/regions.service');
const { success, created, error, paginate } = require('../../utils/response');
const {
  emitCaptainMatched,
  emitTripStatusChanged,
  emitTripCancelled,
  emitTripRequest,
  emitTripTaken,
  emitTripRemoved,
} = require('../../realtime/socket');

const estimateFare = async (req, res, next) => {
  try {
    const { lat_pick, lng_pick, lat_drop, lng_drop } = req.query;
    const data = await service.estimateFare({
      pickupLat:  parseFloat(lat_pick),
      pickupLng:  parseFloat(lng_pick),
      dropoffLat: parseFloat(lat_drop),
      dropoffLng: parseFloat(lng_drop),
    });
    return success(res, data);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const getActiveRegions = async (req, res, next) => {
  try {
    const regions = await regionsService.listActiveRegions();
    return success(res, regions, 'Active service regions retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createTrip = async (req, res, next) => {
  try {
    const trip = await service.createTrip(req.actor.id, req.body);
    const io = req.app.get('io');

    emitTripRequest(io, trip, 10);

    return created(res, trip, 'Trip created and searching for captains');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const getUserTrips = async (req, res, next) => {
  try {
    const { page = 1, per_page = 20 } = req.query;
    const result = await service.getUserTrips(req.actor.id, +page, +per_page);
    return success(res, result.trips, 'Success', 200, paginate(page, per_page, result.total));
  } catch (err) {
    next(err);
  }
};

const getTripById = async (req, res, next) => {
  try {
    const data = await service.getTripById(req.params.id, req.actor.id);
    return success(res, data);
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const cancelTrip = async (req, res, next) => {
  try {
    const trip = await service.cancelTrip(req.params.id, req.actor.id);
    const io = req.app.get('io');
    emitTripCancelled(io, trip.id, trip.userId, trip.driverId, req.actor.id);
    io.in(`trip:${trip.id}`).socketsLeave(`trip:${trip.id}`);
    return success(res, trip, 'Trip cancelled');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const getCaptainTrips = async (req, res, next) => {
  try {
    const { page = 1, per_page = 20 } = req.query;
    const result = await service.getCaptainTrips(req.actor.id, +page, +per_page);
    return success(res, result.trips, 'Success', 200, paginate(page, per_page, result.total));
  } catch (err) {
    next(err);
  }
};

const getNewRequests = async (req, res, next) => {
  try {
    const data = await service.getNewRequests(req.actor.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const acceptTrip = async (req, res, next) => {
  try {
    const trip = await service.acceptTrip(req.params.id, req.actor.id);
    const io = req.app.get('io');

    // Server-side: join both parties to the trip room so location tracking
    // starts immediately without waiting for the client to emit trip.join.
    // This also acts as the authorization gate for captain.location_update
    // tripId validation (socket.rooms.has check in socket.js).
    io.in(`driver:${trip.driverId}`).socketsJoin(`trip:${trip.id}`);
    io.in(`user:${trip.userId}`).socketsJoin(`trip:${trip.id}`);

    emitCaptainMatched(io, trip.userId, trip);
    emitTripTaken(io, trip);
    return success(res, trip, 'Trip accepted');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const declineTrip = async (req, res, next) => {
  try {
    await service.declineTrip(req.params.id, req.actor.id);
    const io = req.app.get('io');
    emitTripRemoved(io, req.actor.id, req.params.id);
    return success(res, null, 'Trip declined');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const startTrip = async (req, res, next) => {
  try {
    const trip = await service.startTrip(req.params.id, req.actor.id);
    const io = req.app.get('io');
    emitTripStatusChanged(io, trip.id, trip.userId, trip.driverId, trip.status, trip);
    return success(res, trip, 'Trip started');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const endTrip = async (req, res, next) => {
  try {
    const trip = await service.endTrip(req.params.id, req.actor.id);
    const io = req.app.get('io');
    emitTripStatusChanged(io, trip.id, trip.userId, trip.driverId, trip.status, trip);
    io.in(`trip:${trip.id}`).socketsLeave(`trip:${trip.id}`);
    return success(res, trip, 'Trip completed');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const rateTrip = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const data = await service.rateTrip(req.params.id, req.actor.id, rating, comment);
    return created(res, data, 'Rating submitted');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const getCaptainRatings = async (req, res, next) => {
  try {
    const { page = 1, per_page = 20 } = req.query;
    const result = await service.getCaptainRatings(req.params.captainId, +page, +per_page);
    return success(res, result.ratings, 'Success', 200, paginate(page, per_page, result.total));
  } catch (err) {
    next(err);
  }
};

const getNearbyCaptains = (req, res, next) => {
  try {
    const { latitude, longitude, radius, serviceId } = req.query;
    const data = service.getNearbyCaptains(+latitude, +longitude, +(radius || 5), serviceId || null);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  estimateFare, getActiveRegions, createTrip, getUserTrips, getTripById, cancelTrip,
  getCaptainTrips, getNewRequests, acceptTrip, declineTrip, startTrip, endTrip,
  rateTrip, getCaptainRatings, getNearbyCaptains,
};
