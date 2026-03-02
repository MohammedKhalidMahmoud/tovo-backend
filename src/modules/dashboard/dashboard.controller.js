const service = require('./dashboard.service');
const { success } = require('../../utils/response');

exports.adminDashboard = async (req, res, next) => {
  try {
    const data = await service.adminDashboard();
    return success(res, data, 'Dashboard summary');
  } catch (err) {
    next(err);
  }
};

exports.rideRequestList = async (req, res, next) => {
  try {
    const filters = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      per_page: req.query.per_page ? parseInt(req.query.per_page) : req.query.limit ? parseInt(req.query.limit) : 20,
      status: req.query.status,
      userId: req.query.userId,
      driverId: req.query.driverId,
      isSchedule: req.query.isSchedule === 'true' || req.query.isSchedule === true,
    };
    const result = await service.rideRequestList(filters);
    // return array directly; pagination is sent separately
    // note: fourth argument is HTTP status code, fifth is pagination object
    return success(res, result.items, 'Ride request list', 200, result.pagination);
  } catch (err) {
    console.error('dashboard.controller.rideRequestList error', err);
    next(err);
  }
};

exports.upcomingRides = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const rides = await service.upcomingRides(limit, req.query.all === 'true');
    return success(res, rides, 'Upcoming rides');
  } catch (err) {
    next(err);
  }
};
