const prisma = require('../../config/prisma');


  

const findActive = () => prisma.vehicleModel.findMany({
    where:   { isActive: true } ,
    orderBy: [{ brand: 'asc' }, { name: 'asc' }],
  });
const findAll = () => prisma.vehicleModel.findMany({ orderBy: [{ brand: 'asc' }, { name: 'asc' }] });
const findById         = (id) => prisma.vehicleModel.findUnique({ where: { id } });
const findActiveById   = (id) => prisma.vehicleModel.findUnique({ where: { id, isActive: true } });
const findByName = (name) => prisma.vehicleModel.findUnique({ where: { name } });
const findByNames = (names) => prisma.vehicleModel.findMany({ where: { name: { in: names } }, select: { name: true } });
const create     = (data) => prisma.vehicleModel.create({ data });
const createMany = (data) => prisma.vehicleModel.createMany({ data });
const update     = (id, data) => prisma.vehicleModel.update({ where: { id }, data });
const remove     = (id)   => prisma.vehicleModel.delete({ where: { id } });

module.exports = { findAll, findActive, findById, findActiveById, findByName, findByNames, create, createMany, update, remove };
