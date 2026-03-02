// ════════════════════════════════════════════════════════════════════════════════
// Vehicles (Fleet) - Admin Controller
// Path: src/modules/admin/vehicles/fleet.controller.js
// Mounted at: /api/v1/admin/vehicles
// ════════════════════════════════════════════════════════════════════════════════

const service = require('./vehicles.service');
const { success } = require('../../../utils/response');

/**
 * GET /api/v1/admin/vehicles
 * List all vehicles with captain and type details.
 */
exports.listVehicles = async (req, res, next) => {
  try {
    const result = await service.listVehicles({
      page:   parseInt(req.query.page)  || 1,
      limit:  parseInt(req.query.limit) || 20,
      typeId: req.query.typeId,
      search: req.query.search,
    });
    res.set('X-Total-Count', result.total);
    res.set('X-Total-Pages', result.pages);
    return success(res, result.data, 'Vehicles retrieved successfully');
  } catch (err) { next(err); }
};

/**
 * GET /api/v1/admin/vehicles/:id
 */
exports.getVehicle = async (req, res, next) => {
  try {
    const vehicle = await service.getVehicle(req.params.id);
    return success(res, vehicle, 'Vehicle retrieved successfully');
  } catch (err) { next(err); }
};

/**
 * POST /api/v1/admin/vehicles
 * Assign a vehicle to a captain.
 */
exports.createVehicle = async (req, res, next) => {
  try {
    const vehicle = await service.createVehicle(req.body);
    return success(res, vehicle, 'Vehicle created successfully', 201);
  } catch (err) { next(err); }
};

/**
 * PUT /api/v1/admin/vehicles/:id
 */
exports.updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await service.updateVehicle(req.params.id, req.body);
    return success(res, vehicle, 'Vehicle updated successfully');
  } catch (err) { next(err); }
};

/**
 * DELETE /api/v1/admin/vehicles/:id
 */
exports.deleteVehicle = async (req, res, next) => {
  try {
    await service.deleteVehicle(req.params.id);
    return success(res, null, 'Vehicle deleted successfully');
  } catch (err) { next(err); }
};
