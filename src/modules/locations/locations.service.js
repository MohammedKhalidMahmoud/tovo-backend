// ── SERVICE ───────────────────────────────────────────────────────────────────
const repo = require('./locations.repository');
const tripsService = require('../trips/trips.service');

const searchLocations = (q, lat, lng, limit) => repo.searchLocations(q, lat, lng, limit);
const reverseGeocode = (lat, lng) => repo.reverseGeocode(lat, lng);
const getNearbyCaptains = (lat, lng, radiusKm) =>
  tripsService.getNearbyCaptains(lat, lng, radiusKm);

module.exports = { searchLocations, reverseGeocode, getNearbyCaptains };
