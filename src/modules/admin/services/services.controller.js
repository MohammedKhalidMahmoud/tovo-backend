// ════════════════════════════════════════════════════════════════════════════════
// Services - Admin Controller
// Path: src/modules/admin/services/services.controller.js
// ════════════════════════════════════════════════════════════════════════════════

const service = require('./services.service');
const { success } = require('../../../utils/response');

/**
 * GET /api/v1/admin/services
 * List all services including inactive ones.
 */
exports.listServices = async (req, res, next) => {
  try {
    const services = await service.listServices();
    return success(res, services, 'Services retrieved successfully');
  } catch (err) { next(err); }
};

/**
 * GET /api/v1/admin/services/:id
 */
exports.getService = async (req, res, next) => {
  try {
    const svc = await service.getService(req.params.id);
    return success(res, svc, 'Service retrieved successfully');
  } catch (err) { next(err); }
};

/**
 * PATCH /api/v1/admin/services/:id
 * Update name, baseFare, or isActive.
 */
exports.updateService = async (req, res, next) => {
  try {
    const svc = await service.updateService(req.params.id, req.body);
    return success(res, svc, 'Service updated successfully');
  } catch (err) { next(err); }
};
exports.createService = async (req, res, next) => {
  try {
    const { name, baseFare, isActive } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Service name is required' });
    }

    const svc = await service.createService({ name, baseFare, isActive });
    return success(res, svc, 'Service created successfully', 201);
  } catch (err) { next(err); }
};