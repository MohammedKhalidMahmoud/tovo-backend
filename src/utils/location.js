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

const decodeEncodedPolyline = (encodedPolyline) => {
  if (!encodedPolyline || typeof encodedPolyline !== 'string') {
    return [];
  }

  const coordinates = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encodedPolyline.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encodedPolyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index <= encodedPolyline.length);

    latitude += (result & 1) ? ~(result >> 1) : (result >> 1);

    shift = 0;
    result = 0;

    do {
      byte = encodedPolyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index <= encodedPolyline.length);

    longitude += (result & 1) ? ~(result >> 1) : (result >> 1);

    coordinates.push({
      lat: latitude / 1e5,
      lng: longitude / 1e5,
    });
  }

  return coordinates;
};

const distancePointToSegmentKm = (point, start, end) => {
  const latScaleKm = 110.574;
  const lngScaleKm = 111.320 * Math.cos((point.lat * Math.PI) / 180);

  const startX = (start.lng - point.lng) * lngScaleKm;
  const startY = (start.lat - point.lat) * latScaleKm;
  const endX = (end.lng - point.lng) * lngScaleKm;
  const endY = (end.lat - point.lat) * latScaleKm;
  const segmentX = endX - startX;
  const segmentY = endY - startY;
  const segmentLengthSquared = segmentX ** 2 + segmentY ** 2;

  if (segmentLengthSquared === 0) {
    return Math.sqrt(startX ** 2 + startY ** 2);
  }

  const projection = Math.max(
    0,
    Math.min(1, -((startX * segmentX) + (startY * segmentY)) / segmentLengthSquared)
  );
  const closestX = startX + projection * segmentX;
  const closestY = startY + projection * segmentY;

  return Math.sqrt(closestX ** 2 + closestY ** 2);
};

const distancePointToPolylineKm = (point, polyline = []) => {
  if (!Array.isArray(polyline) || polyline.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  if (polyline.length === 1) {
    return haversineKm(point.lat, point.lng, polyline[0].lat, polyline[0].lng);
  }

  let minDistanceKm = Number.POSITIVE_INFINITY;

  for (let index = 0; index < polyline.length - 1; index += 1) {
    minDistanceKm = Math.min(
      minDistanceKm,
      distancePointToSegmentKm(point, polyline[index], polyline[index + 1])
    );
  }

  return minDistanceKm;
};

module.exports = {
  haversineKm,
  isPointInCircle,
  findPointInRegions,
  decodeEncodedPolyline,
  distancePointToPolylineKm,
};
