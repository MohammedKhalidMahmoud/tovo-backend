// ════════════════════════════════════════════════════════════════════════════════
// SOS - Admin Service
// Path: src/modules/admin/sos/sos.service.js
// ════════════════════════════════════════════════════════════════════════════════

const prisma = require('../../../config/prisma');

const ownerInclude = {
  user:    { select: { name: true, email: true, phone: true } },
  captain: { select: { name: true, email: true, phone: true } },
};

exports.listAlerts = async ({ page = 1, limit = 20, status } = {}) => {
  const where = {};
  if (status) where.status = status;

  const [total, data] = await Promise.all([
    prisma.sosAlert.count({ where }),
    prisma.sosAlert.findMany({
      where,
      include:  ownerInclude,
      orderBy:  { createdAt: 'desc' },
      skip:     (page - 1) * limit,
      take:     limit,
    }),
  ]);

  return { data, total, pages: Math.ceil(total / limit) };
};

exports.getAlert = async (id) => {
  const alert = await prisma.sosAlert.findUnique({ where: { id }, include: ownerInclude });
  if (!alert) throw Object.assign(new Error('SOS alert not found'), { statusCode: 404 });
  return alert;
};

exports.handleAlert = async (id) => {
  await exports.getAlert(id); // ensure exists
  return prisma.sosAlert.update({
    where: { id },
    data:  { status: 'handled', resolvedAt: new Date() },
    include: ownerInclude,
  });
};
