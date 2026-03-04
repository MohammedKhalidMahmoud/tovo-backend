// ════════════════════════════════════════════════════════════════════════════════
// Services - Admin Service Layer
// Path: src/modules/admin/services/services.service.js
// ════════════════════════════════════════════════════════════════════════════════

const prisma = require('../../../config/prisma');

exports.listServices = async () =>
  prisma.service.findMany({ orderBy: { name: 'asc' } });

exports.getService = async (id) => {
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  return service;
};

exports.updateService = async (id, { name, baseFare, isActive }) => {
  await exports.getService(id); // ensure exists

  const data = {};
  if (name     !== undefined) data.name     = name;
  if (baseFare !== undefined) data.baseFare = parseFloat(baseFare);
  if (isActive !== undefined) data.isActive = isActive;

  return prisma.service.update({ where: { id }, data });
};
