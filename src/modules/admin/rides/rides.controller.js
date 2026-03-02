const service = require('./rides.service');
const { success, error } = require('../../../utils/response');

exports.listRides = async (req, res, next) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      search: req.query.search,
      status: req.query.status || 'all',
      userId: req.query.userId,
      driverId: req.query.driverId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    };

    const result = await service.listRides(filters);

    res.set('X-Total-Count', result.total);
    res.set('X-Total-Pages', result.pages);
    res.set('X-Current-Page', filters.page);
    res.set('X-Per-Page', filters.limit);

    return success(res, result.data, 'Rides retrieved successfully', 200, {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      pages: result.pages,
    });
  } catch (err) {
    next(err);
  }
};

exports.getRide = async (req, res, next) => {
  try {
    const rideId = req.params.rideId;
    const ride = await service.getRideDetails(rideId);
    if (!ride) return error(res, 'Ride not found', 404);
    return success(res, ride, 'Ride retrieved successfully');
  } catch (err) {
    next(err);
  }
};

exports.cancelRide = async (req, res, next) => {
  try {
    const rideId = req.params.rideId;
    const { reason, notes, issueRefund, refundAmount } = req.body;

    const result = await service.cancelRide(rideId, { reason, notes, issueRefund, refundAmount });

    return success(res, result, 'Ride cancelled successfully');
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    next(err);
  }
};

exports.issueRefund = async (req, res, next) => {
  try {
    const rideId = req.params.rideId;
    const { amount, reason, notes } = req.body;

    const result = await service.issueRefund(rideId, { amount, reason, notes });

    return success(res, result, 'Refund issued', 201);
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    next(err);
  }
};

exports.reassignRide = async (req, res, next) => {
  try {
    const rideId = req.params.rideId;
    const { driverId } = req.body;
    const result = await service.reassignRide(rideId, driverId);
    return success(res, result, 'Ride reassigned');
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    next(err);
  }
};

exports.advancedSearch = async (req, res, next) => {
  try {
    const filters = req.query;
    const result = await service.advancedSearch(filters);
    return success(res, result.data, 'Advanced search results', 200, { page: filters.page || 1, limit: filters.limit || 100, total: result.total, pages: result.pages });
  } catch (err) {
    next(err);
  }
};

exports.exportRides = async (req, res, next) => {
  try {
    const { format = 'json', dateFrom, dateTo, status } = req.query;
    const data = await service.exportRides({ format, dateFrom, dateTo, status });

    if (format === 'json') return res.json(data);

    // For csv/xlsx we would stream file — simplified: return JSON listing
    return success(res, data, 'Export prepared');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/admin/rides
 * Create a ride (admin)
 */
exports.createRide = async (req, res, next) => {
  try {
    const payload = {
      userId: req.body.userId,
      pickupLat: req.body.pickupLat,
      pickupLng: req.body.pickupLng,
      dropoffLat: req.body.dropoffLat,
      dropoffLng: req.body.dropoffLng,
      pickupAddress: req.body.pickupAddress,
      dropoffAddress: req.body.dropoffAddress,
      fare: req.body.fare,
      distanceKm: req.body.distanceKm,
      captainId: req.body.captainId,
      status: req.body.status || 'searching',
    };

    const created = await service.createRide(payload);
    return success(res, created, 'Ride created successfully', 201);
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    next(err);
  }
};

/**
 * PUT /api/v1/admin/rides/:rideId
 * Update ride
 */
exports.updateRide = async (req, res, next) => {
  try {
    const rideId = req.params.rideId;
    const update = {
      status: req.body.status,
      fare: req.body.fare,
      captainId: req.body.captainId,
    };
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const updated = await service.updateRide(rideId, update);
    return success(res, updated, 'Ride updated successfully');
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    next(err);
  }
};

/**
 * DELETE /api/v1/admin/rides/:rideId
 */
exports.deleteRide = async (req, res, next) => {
  try {
    const rideId = req.params.rideId;
    await service.deleteRide(rideId);
    return success(res, null, 'Ride deleted successfully');
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    next(err);
  }
};
