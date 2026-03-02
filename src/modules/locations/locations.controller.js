const service = require('./locations.service');
const { success, error } = require('../../utils/response');

const search = async (req, res, next) => {
  try {
    const { q, lat, lng, limit } = req.query;
    if (!q) return error(res, 'Query parameter q is required', 400);
    const data = await service.searchLocations(q, lat, lng, limit);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const reverseGeocode = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    const data = await service.reverseGeocode(lat, lng);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getNearbyCaptains = async (req, res, next) => {
  try {
    const { lat, lng, radius_km } = req.query;
    const data = service.getNearbyCaptains(+lat, +lng, +(radius_km || 5));
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = { search, reverseGeocode, getNearbyCaptains };
