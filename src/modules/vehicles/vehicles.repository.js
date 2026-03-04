const prisma = require('../../config/prisma');

const vehicleInclude = {
  captain:      { select: { id: true, name: true, email: true, phone: true } },
  vehicleModel: true,
};

const findAll = ({ where = {}, skip = 0, take = 20 } = {}) =>
  prisma.vehicle.findMany({ where, include: vehicleInclude, orderBy: { createdAt: 'desc' }, skip, take });

const count = (where = {}) => prisma.vehicle.count({ where });

const findById = (id) =>
  prisma.vehicle.findUnique({ where: { id }, include: vehicleInclude });

const create = (data) =>
  prisma.vehicle.create({ data, include: vehicleInclude });

const update = (id, data) =>
  prisma.vehicle.update({ where: { id }, data, include: vehicleInclude });

const remove = (id) => prisma.vehicle.delete({ where: { id } });

module.exports = { findAll, count, findById, create, update, remove };
