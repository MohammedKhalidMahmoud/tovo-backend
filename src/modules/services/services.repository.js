// ════════════════════════════════════════════════════════════════════════════════
// Services - Repository
// Path: src/modules/services/services.repository.js
// ════════════════════════════════════════════════════════════════════════════════

const prisma = require('../../config/prisma');

const findAll = () =>
  prisma.service.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });

const findById = (id) =>
  prisma.service.findUnique({ where: { id } });

module.exports = { findAll, findById };
