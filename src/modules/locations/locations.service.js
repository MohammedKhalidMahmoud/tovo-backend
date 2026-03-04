// ── SERVICE ───────────────────────────────────────────────────────────────────
const repo = require('./locations.repository');
const tripsService = require('../trips/trips.service');

const searchLocations = (q, lat, lng, limit) => repo.searchLocations(q, lat, lng, limit);
const reverseGeocode = (lat, lng) => repo.reverseGeocode(lat, lng);
const getNearbyCaptains = (lat, lng, radiusKm, serviceId = null) =>
  tripsService.getNearbyCaptains(lat, lng, radiusKm, serviceId);

module.exports = { searchLocations, reverseGeocode, getNearbyCaptains };
