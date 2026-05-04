const repo   = require('./services.repository');
const { invalidateServicesCache } = require('./services.repository');
const prisma = require('../../config/prisma');

const normalizeBoolean = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return !!value;
};

const normalizeInstructionText = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/^[-*\u2022]\s*/, '').trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeInstructions = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return [];
  if (typeof value === 'string') {
    return value
      .split(/\r?\n/)
      .map(normalizeInstructionText)
      .filter(Boolean);
  }
  if (Array.isArray(value)) {
    return value
      .map(normalizeInstructionText)
      .filter(Boolean);
  }
  throw Object.assign(new Error('instructions must be an array of strings or a newline-separated string'), { statusCode: 400 });
};

// ── Public ────────────────────────────────────────────────────────────────────
exports.listActiveServices = () => repo.findAll();

// ── Admin ─────────────────────────────────────────────────────────────────────
exports.listServices = () => prisma.service.findMany({ orderBy: { name: 'asc' } });

exports.getService = async (id) => {
  const svc = await repo.findById(id);
  if (!svc) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  return svc;
};

exports.createService = async ({
  name,
  baseFare = 0,
  perKmRate = 0,
  minimumDistanceKm = 0,
  perStopCharge = 0,
  isActive = true,
  requiresSenderCode,
  requiresReceiverCode,
  maxWeightKg,
  instructions,
}) => {
  try {
    const normalizedInstructions = normalizeInstructions(instructions);
    const svc = await prisma.service.create({
      data: {
        name,
        baseFare: Number(baseFare) || 0,
        perKmRate: Number(perKmRate) || 0,
        minimumDistanceKm: Number(minimumDistanceKm) || 0,
        perStopCharge: Number(perStopCharge) || 0,
        isActive: normalizeBoolean(isActive) ?? true,
        ...(requiresSenderCode !== undefined && { requiresSenderCode: normalizeBoolean(requiresSenderCode) }),
        ...(requiresReceiverCode !== undefined && { requiresReceiverCode: normalizeBoolean(requiresReceiverCode) }),
        ...(maxWeightKg !== undefined && { maxWeightKg: maxWeightKg === null ? null : parseFloat(maxWeightKg) }),
        instructions: normalizedInstructions ?? [],
      },
    });
    invalidateServicesCache();
    return svc;
  } catch (err) {
    if (err?.code === 'P2002') throw { status: 400, message: 'Service name already exists' };
    throw err;
  }
};

exports.updateService = async (id, { name, baseFare, perKmRate, minimumDistanceKm, perStopCharge, isActive, requiresSenderCode, requiresReceiverCode, maxWeightKg, instructions }) => {
  await exports.getService(id);
  const data = {};
  if (name     !== undefined) data.name     = name;
  if (baseFare !== undefined) data.baseFare = parseFloat(baseFare);
  if (perKmRate !== undefined) data.perKmRate = parseFloat(perKmRate);
  if (minimumDistanceKm !== undefined) data.minimumDistanceKm = parseFloat(minimumDistanceKm);
  if (perStopCharge !== undefined) data.perStopCharge = parseFloat(perStopCharge);
  if (isActive !== undefined && isActive !== null) data.isActive = normalizeBoolean(isActive);
  if (requiresSenderCode !== undefined) data.requiresSenderCode = normalizeBoolean(requiresSenderCode);
  if (requiresReceiverCode !== undefined) data.requiresReceiverCode = normalizeBoolean(requiresReceiverCode);
  if (maxWeightKg !== undefined) data.maxWeightKg = maxWeightKg === null ? null : parseFloat(maxWeightKg);
  if (instructions !== undefined) data.instructions = normalizeInstructions(instructions);
  const svc = await prisma.service.update({ where: { id }, data });
  invalidateServicesCache();
  return svc;
};

exports.normalizeInstructions = normalizeInstructions;

exports.deleteService = async (id) => {
  const svc = await repo.findById(id);
  if (!svc) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  await repo.remove(id);
  invalidateServicesCache();
};

exports.updateServiceImage = async (id, imageUrl) => {
  const svc = await repo.findById(id);
  if (!svc) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  const oldImageUrl = svc.imageUrl;
  await repo.updateImageUrl(id, imageUrl);
  invalidateServicesCache();
  return oldImageUrl; // returned so the controller can delete the old file
};

exports.getServiceVehicleModels = async (serviceId) => {
  const svc = await repo.findById(serviceId);
  if (!svc) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  return prisma.serviceVehicleModel.findMany({
    where: { serviceId },
    include: { vehicleModel: true },
    orderBy: { vehicleModel: { name: 'asc' } },
  });
};

exports.addServiceVehicleModel = async (serviceId, vehicleModelId) => {
  const svc = await repo.findById(serviceId);
  if (!svc) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  const model = await prisma.vehicleModel.findUnique({ where: { id: vehicleModelId } });
  if (!model) throw Object.assign(new Error('Vehicle model not found'), { statusCode: 404 });
  try {
    await prisma.serviceVehicleModel.create({
      data: { serviceId, vehicleModelId },
    });
  } catch (err) {
    if (err?.code === 'P2002') throw Object.assign(new Error('Vehicle model already linked to this service'), { statusCode: 400 });
    throw err;
  }
};

exports.removeServiceVehicleModel = async (serviceId, vehicleModelId) => {
  const svc = await repo.findById(serviceId);
  if (!svc) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  const existing = await prisma.serviceVehicleModel.findUnique({
    where: { serviceId_vehicleModelId: { serviceId, vehicleModelId } },
  });
  if (!existing) throw Object.assign(new Error('Vehicle model not linked to this service'), { statusCode: 404 });
  await prisma.serviceVehicleModel.delete({
    where: { serviceId_vehicleModelId: { serviceId, vehicleModelId } },
  });
};
