const prisma = require('../../config/prisma');
const getAll = () => prisma.vehicleModel.findMany({ where: { isActive: true } });
const getById = (id) => prisma.vehicleModel.findUnique({ where: { id } });
module.exports = { getAll, getById };
