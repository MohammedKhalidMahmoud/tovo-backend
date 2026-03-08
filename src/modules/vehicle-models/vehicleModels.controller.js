const service = require('./vehicleModels.service');
const { success, created, error } = require('../../utils/response');

const listModels = async (req, res, next) => {
  try {
    const data = await service.listModels();
    return success(res, data);
  } catch (err) { next(err); }
};

const getModel = async (req, res, next) => {
  try {
    const data = await service.getModel(req.params.id);
    return success(res, data);
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const createModel = async (req, res, next) => {
  try {
    const { name, brand, serviceId, isActive } = req.body;
    const data = await service.createModel({ name, brand, serviceId, isActive });
    return created(res, data, 'Vehicle model created');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const updateModel = async (req, res, next) => {
  try {
    const { name, brand, serviceId, isActive } = req.body;
    const data = await service.updateModel(req.params.id, { name, brand, serviceId, isActive });
    return success(res, data, 'Vehicle model updated');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const deleteModel = async (req, res, next) => {
  try {
    await service.deleteModel(req.params.id);
    return success(res, null, 'Vehicle model deleted');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

module.exports = { listModels, getModel, createModel, updateModel, deleteModel };
