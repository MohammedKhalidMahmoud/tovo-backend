const service = require('./vehicleModels.service');
const { success, error } = require('../../utils/response');

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
    const { name, brand, serviceId, isActive, status } = req.body;
    const data = await service.createModel({ name, brand, serviceId, isActive, status });
    return created(res, data, 'Vehicle model created');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const updateModel = async (req, res, next) => {
  try {
    const { name, brand, serviceId, isActive, status } = req.body;
    const data = await service.updateModel(req.params.id, { name, brand, serviceId, isActive, status });
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

const listActiveModels = async (req, res, next) => {
  try {
    const data = await service.listActiveModels();
    return success(res, data);
  } catch (err) { next(err); }
};

const getActiveModel = async (req, res, next) => {
  try {
    const data = await service.getActiveModel(req.params.id);
    return success(res, data);
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const getModelServices = async (req, res, next) => {
  try {
    const services = await service.getModelServices(req.params.id);
    return success(res, services);
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const created = (res, data, message) => success(res, data, message, 201);

module.exports = { listModels, getModel, createModel, updateModel, deleteModel, listActiveModels, getActiveModel, getModelServices };
