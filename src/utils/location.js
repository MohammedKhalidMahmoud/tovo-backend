// ════════════════════════════════════════════════════════════════════════════════
// Location Utilities
// Path: src/utils/location.js
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Calculate distance between two geographic points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Check if a location point is within a circular region
 * @param {number} pointLat - Latitude of the point to check
 * @param {number} pointLng - Longitude of the point to check
 * @param {number} centerLat - Latitude of region center
 * @param {number} centerLng - Longitude of region center
 * @param {number} radiusKm - Radius of the region in kilometers
 * @returns {boolean} True if point is within the region
 */
const isPointInCircle = (pointLat, pointLng, centerLat, centerLng, radiusKm) => {
  if (!centerLat || !centerLng || !radiusKm) {
    return false; // Invalid region definition
  }

  const distanceKm = haversineKm(pointLat, pointLng, centerLat, centerLng);
  return distanceKm <= radiusKm;
};

/**
 * Check if a location point is within any of the given regions
 * @param {number} pointLat - Latitude of the point to check
 * @param {number} pointLng - Longitude of the point to check
 * @param {Array} regions - Array of region objects with lat, lng, radius properties
 * @returns {object|null} The matching region object or null if no match
 */
const findPointInRegions = (pointLat, pointLng, regions) => {
  if (!Array.isArray(regions) || regions.length === 0) {
    return null;
  }

  for (const region of regions) {
    if (isPointInCircle(pointLat, pointLng, region.lat, region.lng, region.radius)) {
      return region;
    }
  }

  return null;
};

module.exports = {
  haversineKm,
  isPointInCircle,
  findPointInRegions,
};
