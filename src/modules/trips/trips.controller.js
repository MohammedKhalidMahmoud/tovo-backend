const service = require('./trips.service');
const regionsService = require('../regions/regions.service');
const { success, created, error, paginate } = require('../../utils/response');
const {
  emitCaptainMatched,
  emitTripStatusChanged,
  emitTripCancelled,
} = require('../../realtime/socket');

const estimateFare = async (req, res, next) => {
  try {
    const trip = await service.getTripById(req.query.trip_id, req.actor.id);
    const data = await service.estimateFare({
      pickupLat:  trip.pickupLat,
      pickupLng:  trip.pickupLng,
      dropoffLat: trip.dropoffLat,
      dropoffLng: trip.dropoffLng,
      serviceId:  trip.serviceId,
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

    const nearbyCaptains = await service.getNearbyCaptains(trip.pickupLat, trip.pickupLng, 10, trip.serviceId);
    nearbyCaptains.forEach((c) => io.to(`captain:${c.id}`).emit('trip.new_request', trip));

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
    emitTripCancelled(io, trip.id, trip.userId, trip.captainId, req.actor.id);
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
    emitCaptainMatched(io, trip.userId, trip);
    io.to('captains:available').emit('trip.taken', { tripId: trip.id });
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
    io.to(`captain:${req.actor.id}`).emit('trip.removed', { tripId: req.params.id });
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
    emitTripStatusChanged(io, trip.id, trip.userId, trip.captainId, trip.status, trip);
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
    emitTripStatusChanged(io, trip.id, trip.userId, trip.captainId, trip.status, trip);
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
