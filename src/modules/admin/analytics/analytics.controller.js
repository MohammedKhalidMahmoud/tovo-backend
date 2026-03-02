const service = require('./analytics.service');
const { success, error } = require('../../../utils/response');

exports.rideStats = async (req, res, next) => {
  try {
    const filters = { dateFrom: req.query.dateFrom, dateTo: req.query.dateTo, driverId: req.query.driverId, userId: req.query.userId };
    const stats = await service.rideStats(filters);
    return success(res, stats, 'Ride statistics');
  } catch (err) {
    next(err);
  }
};

exports.driverPerformance = async (req, res, next) => {
  try {
    const stats = await service.driverPerformance({ dateFrom: req.query.dateFrom, dateTo: req.query.dateTo });
    return success(res, stats, 'Driver performance');
  } catch (err) {
    next(err);
  }
};

exports.userActivity = async (req, res, next) => {
  try {
    const stats = await service.userActivity({ dateFrom: req.query.dateFrom, dateTo: req.query.dateTo });
    return success(res, stats, 'User activity');
  } catch (err) {
    next(err);
  }
};