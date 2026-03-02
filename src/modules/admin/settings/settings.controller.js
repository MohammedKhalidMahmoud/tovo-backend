const service = require('./settings.service');
const { success, error } = require('../../../utils/response');

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await service.getSettings();
    return success(res, settings, 'Settings retrieved');
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const updated = await service.updateSettings(req.body);
    return success(res, updated, 'Settings updated');
  } catch (err) {
    next(err);
  }
};
