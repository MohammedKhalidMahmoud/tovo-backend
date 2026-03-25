const prisma = require('../../config/prisma');

const findAll = () =>
  prisma.commissionRule.findMany({
    orderBy: { createdAt: 'desc' },
  });

const findById = (id) =>
  prisma.commissionRule.findUnique({ where: { id } });

const create = (data) =>
  prisma.commissionRule.create({ data });

const update = (id, data) =>
  prisma.commissionRule.update({ where: { id }, data });

const remove = (id) =>
  prisma.commissionRule.delete({ where: { id } });

const findActiveRule = () =>
  prisma.commissionRule.findFirst({
    where: { status: true },
  });

// Atomic: deactivate any currently active rule, then activate the target rule
const activateRule = (id) =>
  prisma.$transaction([
    prisma.commissionRule.updateMany({
      where: { status: true, id: { not: id } },
      data: { status: false },
    }),
    prisma.commissionRule.update({
      where: { id },
      data: { status: true },
    }),
  ]);

module.exports = { findAll, findById, create, update, remove, findActiveRule, activateRule };
