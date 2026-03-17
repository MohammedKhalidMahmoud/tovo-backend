// ════════════════════════════════════════════════════════════════════════════════
// Regions - Admin Service
// Path: src/modules/admin/regions/regions.service.js
// ════════════════════════════════════════════════════════════════════════════════

const prisma = require('../../config/prisma');
const repo   = require('./regions.repository');

// ── In-process TTL cache for active regions ───────────────────────────────────
let _regionsCache = null;
let _regionsCacheAt = 0;
const REGIONS_TTL_MS = 60_000; // 60 seconds

const invalidateRegionsCache = () => { _regionsCache = null; };

exports.listRegions = async ({ page = 1, limit = 20, isActive, search } = {}) => {
  const where = {};
  if (isActive !== undefined) where.status = isActive;
  if (search) {
    where.OR = [
      { name:    { contains: search, mode: 'insensitive' } },
      { country: { contains: search, mode: 'insensitive' } },
      { city:    { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.region.count({ where }),
    prisma.region.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { data, total, pages: Math.ceil(total / limit) };
};

exports.getRegion = async (id) => {
  const region = await prisma.region.findUnique({ where: { id } });
  if (!region) throw Object.assign(new Error('Region not found'), { statusCode: 404 });
  return region;
};

exports.listActiveRegions = async () => {
  if (_regionsCache && Date.now() - _regionsCacheAt < REGIONS_TTL_MS) {
    return _regionsCache;
  }
  const regions = await prisma.region.findMany({
    where: { status: true },
    select: { id: true, name: true, lat: true, lng: true, radius: true },
    orderBy: { name: 'asc' },
  });
  _regionsCache = regions;
  _regionsCacheAt = Date.now();
  return regions;
};

exports.createRegion = async ({ name, country, city, lat, lng, radius, status = true }) => {
  const region = await prisma.region.create({
    data: {
      name,
      // country,
      city: city || null,
      lat: lat ?? null,
      lng: lng ?? null,
      radius: radius ?? null,
      status,
    },
  });
  invalidateRegionsCache();
  return region;
};

exports.updateRegion = async (id, { name, country, city, lat, lng, radius, isActive }) => {
  await exports.getRegion(id); // ensure exists

  const data = {};
  if (name     !== undefined) data.name     = name;
  if (country  !== undefined) data.country  = country;
  if (city     !== undefined) data.city     = city;
  if (lat      !== undefined) data.lat      = lat;
  if (lng      !== undefined) data.lng      = lng;
  if (radius   !== undefined) data.radius   = radius;
  if (isActive !== undefined) data.status = isActive;

  const region = await prisma.region.update({ where: { id }, data });
  invalidateRegionsCache();
  return region;
};

exports.deleteRegion = async (id) => {
  await exports.getRegion(id); // ensure exists
  await prisma.region.delete({ where: { id } });
  invalidateRegionsCache();
};

exports.getActiveRegion = async (id) => {
  const region = await repo.findActiveById(id);
  if (!region) throw Object.assign(new Error('Region not found'), { statusCode: 404 });
  return region;
};
