// ════════════════════════════════════════════════════════════════════════════════
// Vehicle Types - Admin Controller
// Path: src/modules/admin/vehicles/vehicles.controller.js
// ════════════════════════════════════════════════════════════════════════════════

const service = require('./vehicles.service');
const { success } = require('../../../utils/response');

exports.listVehicleTypes = async (req, res, next) => {
  try {
    const types = await service.listVehicleTypes();
    return success(res, types, 'Vehicle types retrieved');
  } catch (err) { next(err); }
};

exports.createVehicleType = async (req, res, next) => {
  try {
    const type = await service.createVehicleType(req.body);
    return success(res, type, 'Vehicle type created', 201);
  } catch (err) { next(err); }
};

exports.updateVehicleType = async (req, res, next) => {
  try {
    const type = await service.updateVehicleType(req.params.id, req.body);
    return success(res, type, 'Vehicle type updated');
  } catch (err) { next(err); }
};

exports.deleteVehicleType = async (req, res, next) => {
  try {
    await service.deleteVehicleType(req.params.id);
    return success(res, null, 'Vehicle type deleted');
  } catch (err) { next(err); }
};
