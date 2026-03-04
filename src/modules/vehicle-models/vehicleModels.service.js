const repo = require('./vehicleModels.repository');

const listModels = (onlyActive = false) => repo.findAll(onlyActive);

const getModel = async (id) => {
  const model = await repo.findById(id);
  if (!model) throw { status: 404, message: 'Vehicle model not found' };
  return model;
};

const createModel = async ({ name, brand, isActive }) => {
  const existing = await repo.findByName(name);
  if (existing) throw { status: 409, message: 'A vehicle model with this name already exists' };
  return repo.create({ name, brand, isActive: isActive ?? true });
};

const updateModel = async (id, data) => {
  const model = await repo.findById(id);
  if (!model) throw { status: 404, message: 'Vehicle model not found' };
  return repo.update(id, data);
};

const deleteModel = async (id) => {
  const model = await repo.findById(id);
  if (!model) throw { status: 404, message: 'Vehicle model not found' };
  return repo.remove(id);
};

module.exports = { listModels, getModel, createModel, updateModel, deleteModel };
