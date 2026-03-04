const prisma = require('../../../config/prisma');

const findAll = (onlyActive = false) =>
  prisma.vehicleModel.findMany({
    where: onlyActive ? { isActive: true } : undefined,
    orderBy: [{ brand: 'asc' }, { name: 'asc' }],
  });

const findById = (id) =>
  prisma.vehicleModel.findUnique({ where: { id } });

const findByName = (name) =>
  prisma.vehicleModel.findUnique({ where: { name } });

const create = (data) =>
  prisma.vehicleModel.create({ data });

const update = (id, data) =>
  prisma.vehicleModel.update({ where: { id }, data });

const remove = (id) =>
  prisma.vehicleModel.delete({ where: { id } });

module.exports = { findAll, findById, findByName, create, update, remove };
