const repo = require('./vehicleModels.repository');
const prisma = require('../../config/prisma');

const listModels = () => repo.findAll();

const listActiveModels = () => repo.findActive();

const getModel = async (id) => {
  const model = await repo.findById(id);
  if (!model) throw { status: 404, message: 'Vehicle model not found' };
  return model;
};

const getActiveModel = async (id) => {
  const model = await repo.findActiveById(id);
  if (!model) throw { status: 404, message: 'Vehicle model not found' };
  return model;
};

const validateServiceExists = async (serviceId) => {
  const svc = await prisma.service.findUnique({ where: { id: serviceId }, select: { id: true } });
  if (!svc) throw { status: 400, message: 'serviceId does not match any existing service' };
};

const createModel = async ({ name, brand, serviceId, isActive }) => {
  const existing = await repo.findByName(name);
  if (existing) throw { status: 409, message: 'A vehicle model with this name already exists' };
  await validateServiceExists(serviceId);
  return repo.create({ name, brand, serviceId, isActive: isActive ?? true });
};

const updateModel = async (id, data) => {
  const model = await repo.findById(id);
  if (!model) throw { status: 404, message: 'Vehicle model not found' };
  if (data.serviceId !== undefined) await validateServiceExists(data.serviceId);
  return repo.update(id, data);
};

const deleteModel = async (id) => {
  const model = await repo.findById(id);
  if (!model) throw { status: 404, message: 'Vehicle model not found' };
  return repo.remove(id);
};

module.exports = { listModels, listActiveModels, getModel, getActiveModel, createModel, updateModel, deleteModel };
