// ── REPOSITORY ────────────────────────────────────────────────────────────────
const prisma = require('../../config/prisma');
const getAll = () => prisma.vehicleType.findMany();
const getById = (id) => prisma.vehicleType.findUnique({ where: { id } });
const create = (data) => prisma.vehicleType.create({ data });
module.exports = { getAll, getById, create };
