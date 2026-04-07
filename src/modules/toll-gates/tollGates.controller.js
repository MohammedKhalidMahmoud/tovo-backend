const service = require('./tollGates.service');
const { success, created, error, paginate } = require('../../utils/response');

const listTollGates = async (req, res, next) => {
  try {
    const result = await service.listTollGates({
      page: req.query.page || 1,
      limit: req.query.limit || 20,
    });

    return success(
      res,
      result.data,
      'Toll gates retrieved successfully',
      200,
      paginate(result.page, result.limit, result.total),
    );
  } catch (err) {
    next(err);
  }
};

const getTollGate = async (req, res, next) => {
  try {
    const data = await service.getTollGate(req.params.id);
    return success(res, data, 'Toll gate retrieved successfully');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const createTollGate = async (req, res, next) => {
  try {
    const data = await service.createTollGate(req.body);
    return created(res, data, 'Toll gate created successfully');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const updateTollGate = async (req, res, next) => {
  try {
    const data = await service.updateTollGate(req.params.id, req.body);
    return success(res, data, 'Toll gate updated successfully');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const deleteTollGate = async (req, res, next) => {
  try {
    await service.deleteTollGate(req.params.id);
    return success(res, null, 'Toll gate deleted successfully');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

module.exports = { listTollGates, getTollGate, createTollGate, updateTollGate, deleteTollGate };
