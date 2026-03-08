// ════════════════════════════════════════════════════════════════════════════════
// Services - Repository
// Path: src/modules/services/services.repository.js
// ════════════════════════════════════════════════════════════════════════════════

const prisma = require('../../config/prisma');

const findAll = () =>
  prisma.service.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });

const findById = (id) =>
  prisma.service.findUnique({ where: { id } });

const updateImageUrl = (id, imageUrl) =>
  prisma.service.update({ where: { id }, data: { imageUrl } });

module.exports = { findAll, findById, updateImageUrl };
