// ════════════════════════════════════════════════════════════════════════════════
// Regions - Admin Controller
// Path: src/modules/admin/regions/regions.controller.js
// ════════════════════════════════════════════════════════════════════════════════

const service = require('./regions.service');
const { success, error } = require('../../../utils/response');

/**
 * GET /api/v1/admin/regions
 */
exports.listRegions = async (req, res, next) => {
  try {
    const isActive = req.query.isActive !== undefined
      ? req.query.isActive === 'true'
      : undefined;

    const result = await service.listRegions({
      page:     parseInt(req.query.page)  || 1,
      limit:    parseInt(req.query.limit) || 20,
      isActive,
      search:   req.query.search,
    });

    res.set('X-Total-Count', result.total);
    res.set('X-Total-Pages', result.pages);
    return success(res, result.data, 'Regions retrieved successfully');
  } catch (err) { next(err); }
};

/**
 * GET /api/v1/admin/regions/:id
 */
exports.getRegion = async (req, res, next) => {
  try {
    const region = await service.getRegion(req.params.id);
    return success(res, region, 'Region retrieved successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

/**
 * POST /api/v1/admin/regions
 */
exports.createRegion = async (req, res, next) => {
  try {
    const region = await service.createRegion(req.body);
    return success(res, region, 'Region created successfully', 201);
  } catch (err) { next(err); }
};

/**
 * PUT /api/v1/admin/regions/:id
 */
exports.updateRegion = async (req, res, next) => {
  try {
    const region = await service.updateRegion(req.params.id, req.body);
    return success(res, region, 'Region updated successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

/**
 * DELETE /api/v1/admin/regions/:id
 */
exports.deleteRegion = async (req, res, next) => {
  try {
    await service.deleteRegion(req.params.id);
    return success(res, null, 'Region deleted successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};
