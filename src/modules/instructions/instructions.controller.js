const service = require('./instructions.servoce');
const { success, error } = require('../../utils/response');

const parseIsActive = (value) => (value !== undefined ? value === 'true' : undefined);

const listInstructions = async (req, res, next) => {
  try {
    const result = await service.listInstructions({
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 20,
      isActive: parseIsActive(req.query.isActive),
      search: req.query.search,
      serviceId: req.query.serviceId,
    });

    res.set('X-Total-Count', result.total);
    res.set('X-Total-Pages', result.pages);
    return success(res, result.data, 'Instructions retrieved successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const getInstruction = async (req, res, next) => {
  try {
    const instruction = await service.getInstruction(req.params.id);
    return success(res, instruction, 'Instruction retrieved successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const listActiveInstructions = async (req, res, next) => {
  try {
    const data = await service.listActiveInstructions({ serviceId: req.query.serviceId });
    return success(res, data, 'Instructions retrieved successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const listActiveInstructionsByService = async (req, res, next) => {
  try {
    const data = await service.listActiveInstructions({ serviceId: req.params.serviceId });
    return success(res, data, 'Instructions retrieved successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const getActiveInstruction = async (req, res, next) => {
  try {
    const instruction = await service.getActiveInstruction(req.params.id);
    return success(res, instruction, 'Instruction retrieved successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const createInstruction = async (req, res, next) => {
  try {
    const instruction = await service.createInstruction(req.body);
    return success(res, instruction, 'Instruction created successfully', 201);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const updateInstruction = async (req, res, next) => {
  try {
    const instruction = await service.updateInstruction(req.params.id, req.body);
    return success(res, instruction, 'Instruction updated successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const deleteInstruction = async (req, res, next) => {
  try {
    await service.deleteInstruction(req.params.id);
    return success(res, null, 'Instruction deleted successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const getInstructionServices = async (req, res, next) => {
  try {
    const services = await service.getInstructionServices(req.params.id);
    return success(res, services, 'Instruction services retrieved successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const linkInstructionService = async (req, res, next) => {
  try {
    await service.linkInstructionService(req.params.id, req.body.serviceId);
    return success(res, null, 'Service linked successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const unlinkInstructionService = async (req, res, next) => {
  try {
    await service.unlinkInstructionService(req.params.id, req.params.serviceId);
    return success(res, null, 'Service unlinked successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = {
  listInstructions,
  getInstruction,
  listActiveInstructions,
  listActiveInstructionsByService,
  getActiveInstruction,
  createInstruction,
  updateInstruction,
  deleteInstruction,
  getInstructionServices,
  linkInstructionService,
  unlinkInstructionService,
};
