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

const normalizeRegionPoints = (points) => {
  if (!Array.isArray(points)) return [];

  return points
    .map((point) => ({
      lat: Number(point?.lat),
      lng: Number(point?.lng),
    }))
    .filter((point) => (
      Number.isFinite(point.lat) &&
      point.lat >= -90 &&
      point.lat <= 90 &&
      Number.isFinite(point.lng) &&
      point.lng >= -180 &&
      point.lng <= 180
    ));
};

const assertPolygonPoints = (points) => {
  const normalized = normalizeRegionPoints(points);
  if (normalized.length < 3) {
    throw Object.assign(new Error('Region polygon must contain at least 3 valid points'), { statusCode: 400 });
  }
  return normalized;
};

const getPolygonCenter = (points) => {
  const normalized = normalizeRegionPoints(points);
  if (normalized.length === 0) return { lat: null, lng: null };

  const total = normalized.reduce(
    (sum, point) => ({
      lat: sum.lat + point.lat,
      lng: sum.lng + point.lng,
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: total.lat / normalized.length,
    lng: total.lng / normalized.length,
  };
};

exports.listRegions = async ({ page = 1, limit = 20, isActive, search } = {}) => {
  const where = {};
  if (isActive !== undefined) where.status = isActive;
  if (search) {
    where.OR = [
      { name:    { contains: search } },
      { city:    { contains: search } },
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
    select: { id: true, name: true, city: true, points: true },
    orderBy: { name: 'asc' },
  });
  _regionsCache = regions;
  _regionsCacheAt = Date.now();
  return regions;
};

exports.createRegion = async ({ name, city, points, status = true }) => {
  const polygonPoints = assertPolygonPoints(points);
  const center = getPolygonCenter(polygonPoints);

  const region = await prisma.region.create({
    data: {
      name,
      city: city || null,
      points: polygonPoints,
      lat: center.lat,
      lng: center.lng,
      radius: null,
      status,
    },
  });
  invalidateRegionsCache();
  return region;
};

exports.updateRegion = async (id, { name, city, points, status, isActive }) => {
  await exports.getRegion(id); // ensure exists

  const data = {};
  if (name     !== undefined) data.name     = name;
  if (city     !== undefined) data.city     = city;
  if (points   !== undefined) {
    const polygonPoints = assertPolygonPoints(points);
    const center = getPolygonCenter(polygonPoints);
    data.points = polygonPoints;
    data.lat = center.lat;
    data.lng = center.lng;
    data.radius = null;
  }
  if (status   !== undefined) data.status   = status;
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
