const service = require('./settings.service');
const { success, created, error } = require('../../utils/response');

exports.getPublicSettings = async (req, res, next) => {
  try {
    const data = await service.getPublicSettings();
    return success(res, data, 'Settings retrieved');
  } catch (err) { next(err); }
};

exports.listSettings = async (req, res, next) => {
  try {
    const data = await service.listSettings();
    return success(res, data, 'Settings retrieved');
  } catch (err) { next(err); }
};

exports.createSetting = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    const data = await service.createSetting(key, value);
    return created(res, data, 'Setting created');
  } catch (err) { next(err); }
};

exports.updateSetting = async (req, res, next) => {
  try {
    const data = await service.updateSetting(req.params.id, req.body);
    return success(res, data, 'Setting updated');
  } catch (err) { next(err); }
};

exports.deleteSetting = async (req, res, next) => {
  try {
    await service.deleteSetting(req.params.id);
    return success(res, null, 'Setting deleted');
  } catch (err) { next(err); }
};
