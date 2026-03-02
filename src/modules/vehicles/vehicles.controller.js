const service = require('./vehicles.service');
const { success, error } = require('../../utils/response');

const getAll = async (req, res, next) => {
  try { return success(res, await service.getAll()); } catch (err) { next(err); }
};
const getById = async (req, res, next) => {
  try {
    return success(res, await service.getById(req.params.id));
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};
const addNewType = async (req, res, next) => {
  try {
    return success(res, await service.addNewType(req.body), 201);
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};
module.exports = { getAll, getById, addNewType };
