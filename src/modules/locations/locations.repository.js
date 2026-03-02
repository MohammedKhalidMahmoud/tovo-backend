// locations.repository.js
const prisma = require('../../config/prisma');

const searchLocations = async (q, lat, lng, limit = 10) => {
  // In production: call Google Places API or similar
  // Returning mock structure for implementation guide
  return [{ placeId: 'mock', description: q, lat: lat || 0, lng: lng || 0 }];
};

const reverseGeocode = async (lat, lng) => {
  // In production: call Google Reverse Geocoding API
  return { address: `${lat}, ${lng}`, lat, lng };
};

module.exports = { searchLocations, reverseGeocode };
