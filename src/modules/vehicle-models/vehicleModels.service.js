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

const normalizeBoolean = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return Boolean(value);
};

const normalizeStatusFields = ({ isActive, status }) => {
  const normalizedStatus = normalizeBoolean(status);
  const normalizedIsActive = normalizeBoolean(isActive);
  const effectiveStatus = normalizedStatus ?? normalizedIsActive ?? true;

  return {
    isActive: normalizedIsActive ?? effectiveStatus,
    status: effectiveStatus,
  };
};

const createModel = async ({ name, brand, serviceId, isActive, status }) => {
  const existing = await repo.findByName(name);
  if (existing) throw { status: 409, message: 'A vehicle model with this name already exists' };
  await validateServiceExists(serviceId);
  return repo.create({ name, brand, serviceId, ...normalizeStatusFields({ isActive, status }) });
};

const updateModel = async (id, data) => {
  const model = await repo.findById(id);
  if (!model) throw { status: 404, message: 'Vehicle model not found' };
  if (data.serviceId !== undefined) await validateServiceExists(data.serviceId);
  const updateData = { ...data };
  if (data.isActive !== undefined || data.status !== undefined) {
    Object.assign(updateData, normalizeStatusFields({
      isActive: data.isActive ?? model.isActive,
      status: data.status ?? data.isActive ?? model.status,
    }));
  }
  return repo.update(id, updateData);
};

const deleteModel = async (id) => {
  const model = await repo.findById(id);
  if (!model) throw { status: 404, message: 'Vehicle model not found' };
  return repo.remove(id);
};

const getModelServices = async (modelId) => {
  const model = await repo.findById(modelId);
  if (!model) throw { status: 404, message: 'Vehicle model not found' };

  const prisma = require('../../config/prisma');
  return prisma.serviceVehicleModel.findMany({
    where: { vehicleModelId: modelId },
    include: { service: true },
    orderBy: { service: { name: 'asc' } },
  });
};

module.exports = { listModels, listActiveModels, getModel, getActiveModel, createModel, updateModel, deleteModel, getModelServices };
