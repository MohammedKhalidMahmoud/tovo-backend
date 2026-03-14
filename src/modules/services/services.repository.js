// ════════════════════════════════════════════════════════════════════════════════
// Services - Repository
// Path: src/modules/services/services.repository.js
// ════════════════════════════════════════════════════════════════════════════════

const prisma = require('../../config/prisma');

// ── In-process TTL cache for active services ──────────────────────────────────
let _servicesCache = null;
let _servicesCacheAt = 0;
const SERVICES_TTL_MS = 60_000; // 60 seconds

const invalidateServicesCache = () => { _servicesCache = null; };

const findAll = async () => {
  if (_servicesCache && Date.now() - _servicesCacheAt < SERVICES_TTL_MS) {
    return _servicesCache;
  }
  const services = await prisma.service.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  _servicesCache = services;
  _servicesCacheAt = Date.now();
  return services;
};

const findById = (id) =>
  prisma.service.findUnique({ where: { id } });

const updateImageUrl = (id, imageUrl) =>
  prisma.service.update({ where: { id }, data: { imageUrl } });

module.exports = { findAll, findById, updateImageUrl, invalidateServicesCache };
