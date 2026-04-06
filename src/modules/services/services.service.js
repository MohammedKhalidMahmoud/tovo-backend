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
  fixedSurcharge = 0,
  isActive = true,
  requiresSenderCode,
  requiresReceiverCode,
  maxWeightKg,
}) => {
  try {
    const svc = await prisma.service.create({
      data: {
        name,
        baseFare: Number(baseFare) || 0,
        fixedSurcharge: Number(fixedSurcharge) || 0,
        isActive: normalizeBoolean(isActive) ?? true,
        ...(requiresSenderCode !== undefined && { requiresSenderCode: normalizeBoolean(requiresSenderCode) }),
        ...(requiresReceiverCode !== undefined && { requiresReceiverCode: normalizeBoolean(requiresReceiverCode) }),
        ...(maxWeightKg !== undefined && { maxWeightKg: maxWeightKg === null ? null : parseFloat(maxWeightKg) }),
      },
    });
    invalidateServicesCache();
    return svc;
  } catch (err) {
    if (err?.code === 'P2002') throw { status: 400, message: 'Service name already exists' };
    throw err;
  }
};

exports.updateService = async (id, { name, baseFare, fixedSurcharge, isActive, requiresSenderCode, requiresReceiverCode, maxWeightKg }) => {
  await exports.getService(id);
  const data = {};
  if (name     !== undefined) data.name     = name;
  if (baseFare !== undefined) data.baseFare = parseFloat(baseFare);
  if (fixedSurcharge !== undefined) data.fixedSurcharge = parseFloat(fixedSurcharge);
  if (isActive !== undefined && isActive !== null) data.isActive = normalizeBoolean(isActive);
  if (requiresSenderCode !== undefined) data.requiresSenderCode = normalizeBoolean(requiresSenderCode);
  if (requiresReceiverCode !== undefined) data.requiresReceiverCode = normalizeBoolean(requiresReceiverCode);
  if (maxWeightKg !== undefined) data.maxWeightKg = maxWeightKg === null ? null : parseFloat(maxWeightKg);
  const svc = await prisma.service.update({ where: { id }, data });
  invalidateServicesCache();
  return svc;
};

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
