const service = require('./admins.service');
const { success, error } = require('../../../utils/response');

exports.listAdmins = async (req, res, next) => {
  try {
    const admins = await service.listAdmins();
    return success(res, admins, 'Admins retrieved');
  } catch (err) {
    next(err);
  }
};

exports.createAdmin = async (req, res, next) => {
  try {
    const admin = await service.createAdmin(req.body);
    return success(res, admin, 'Admin created', null, 201);
  } catch (err) {
    next(err);
  }
};

exports.updateAdmin = async (req, res, next) => {
  try {
    const admin = await service.updateAdmin(req.params.id, req.body);
    return success(res, admin, 'Admin updated');
  } catch (err) {
    next(err);
  }
};

exports.deleteAdmin = async (req, res, next) => {
  try {
    await service.deleteAdmin(req.params.id);
    return success(res, null, 'Admin deleted');
  } catch (err) {
    next(err);
  }
};
