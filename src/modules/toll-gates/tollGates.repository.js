const prisma = require('../../config/prisma');

const findAll = ({ skip = 0, take = 20 } = {}) =>
  prisma.tollGate.findMany({
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    skip,
    take,
  });

const countAll = () => prisma.tollGate.count();

const findById = (id) => prisma.tollGate.findUnique({ where: { id } });

const create = (data) => prisma.tollGate.create({ data });

const update = (id, data) => prisma.tollGate.update({ where: { id }, data });

const remove = (id) => prisma.tollGate.delete({ where: { id } });

module.exports = { findAll, countAll, findById, create, update, remove };
