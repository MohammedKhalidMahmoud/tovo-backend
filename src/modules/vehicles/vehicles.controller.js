const service = require('./vehicles.service');
const { success } = require('../../utils/response');

exports.listVehicles = async (req, res, next) => {
  try {
    const result = await service.listVehicles({
      page:           parseInt(req.query.page)  || 1,
      limit:          parseInt(req.query.limit) || 20,
      vehicleModelId: req.query.vehicleModelId,
      search:         req.query.search,
    });
    res.set('X-Total-Count', result.total);
    res.set('X-Total-Pages', result.pages);
    return success(res, result.data, 'Vehicles retrieved successfully');
  } catch (err) { next(err); }
};

exports.getVehicle = async (req, res, next) => {
  try {
    const vehicle = await service.getVehicle(req.params.id);
    return success(res, vehicle, 'Vehicle retrieved successfully');
  } catch (err) { next(err); }
};

exports.createVehicle = async (req, res, next) => {
  try {
    const vehicle = await service.createVehicle(req.body);
    return success(res, vehicle, 'Vehicle created successfully', 201);
  } catch (err) { next(err); }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await service.updateVehicle(req.params.id, req.body);
    return success(res, vehicle, 'Vehicle updated successfully');
  } catch (err) { next(err); }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    await service.deleteVehicle(req.params.id);
    return success(res, null, 'Vehicle deleted successfully');
  } catch (err) { next(err); }
};

exports.getMyVehicle = async (req, res, next) => {
  try {
    const vehicle = await service.getMyVehicle(req.actor.id);
    return success(res, vehicle, 'Vehicle retrieved successfully');
  } catch (err) { next(err); }
};
