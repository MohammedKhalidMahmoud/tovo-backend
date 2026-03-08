const repo   = require('./services.repository');
const prisma = require('../../config/prisma');

// ── Public ────────────────────────────────────────────────────────────────────
exports.listActiveServices = () => repo.findAll();

// ── Admin ─────────────────────────────────────────────────────────────────────
exports.listServices = () => prisma.service.findMany({ orderBy: { name: 'asc' } });

exports.getService = async (id) => {
  const svc = await repo.findById(id);
  if (!svc) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  return svc;
};

exports.createService = async ({ name, baseFare = 0, isActive = true }) => {
  try {
    return await prisma.service.create({
      data: { name, baseFare: Number(baseFare) || 0, isActive: !!isActive },
    });
  } catch (err) {
    if (err?.code === 'P2002') throw { status: 400, message: 'Service name already exists' };
    throw err;
  }
};

exports.updateService = async (id, { name, baseFare, isActive }) => {
  await exports.getService(id);
  const data = {};
  if (name     !== undefined) data.name     = name;
  if (baseFare !== undefined) data.baseFare = parseFloat(baseFare);
  if (isActive !== undefined) data.isActive = isActive;
  return prisma.service.update({ where: { id }, data });
};

exports.updateServiceImage = async (id, imageUrl) => {
  const svc = await repo.findById(id);
  if (!svc) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  const oldImageUrl = svc.imageUrl;
  await repo.updateImageUrl(id, imageUrl);
  return oldImageUrl; // returned so the controller can delete the old file
};
