const prisma = require('../../config/prisma');

const SERVICE_INCLUDE = {
  service: { select: { id: true, name: true } },
};

const findAll = () =>
  prisma.commissionRule.findMany({
    include: SERVICE_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

const findById = (id) =>
  prisma.commissionRule.findUnique({ where: { id }, include: SERVICE_INCLUDE });

const create = (data) =>
  prisma.commissionRule.create({ data, include: SERVICE_INCLUDE });

const update = (id, data) =>
  prisma.commissionRule.update({ where: { id }, data, include: SERVICE_INCLUDE });

const remove = (id) =>
  prisma.commissionRule.delete({ where: { id } });

// Returns the best matching active rule: service-specific first, then global fallback
const findActiveRule = async (serviceId) => {
  if (serviceId) {
    const rule = await prisma.commissionRule.findFirst({
      where: { serviceId, status: true },
    });
    if (rule) return rule;
  }
  return prisma.commissionRule.findFirst({
    where: { serviceId: null, status: true },
  });
};

// Atomic: deactivate current active rule for same serviceId, then activate the target rule
const activateRule = (id, serviceId) =>
  prisma.$transaction([
    prisma.commissionRule.updateMany({
      where: { serviceId: serviceId ?? null, status: true, id: { not: id } },
      data: { status: false },
    }),
    prisma.commissionRule.update({
      where: { id },
      data: { status: true },
      include: SERVICE_INCLUDE,
    }),
  ]);

module.exports = { findAll, findById, create, update, remove, findActiveRule, activateRule };
