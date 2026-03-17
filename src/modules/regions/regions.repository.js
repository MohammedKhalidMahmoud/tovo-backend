const prisma = require('../../config/prisma');

const findAllActive  = () => prisma.region.findMany({ where: { status: true }, orderBy: { name: 'asc' } });
const findActiveById = (id) => prisma.region.findUnique({ where: { id, status: true } });

module.exports = { findAllActive, findActiveById };
