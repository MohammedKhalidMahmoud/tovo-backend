const service = require('./drivers.service');
const { success, error } = require('../../utils/response');
const { deleteLocalFile } = require('../../utils/uploads');

const getProfile = async (req, res, next) => {
  try {
    const data = await service.getProfile(req.actor.id);
    return success(res, data);
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = await service.updateProfile(req.actor.id, req.body);
    return success(res, data, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);
    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const oldUrl = await service.updateAvatar(req.actor.id, avatarUrl);
    deleteLocalFile(oldUrl);
    return success(res, { avatarUrl }, 'Avatar updated');
  } catch (err) {
    next(err);
  }
};

const startDuty = async (req, res, next) => {
  try {
    await service.startDuty(req.actor.id, req.body);
    return success(res, {}, 'You are now on duty');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const endDuty = async (req, res, next) => {
  try {
    await service.endDuty(req.actor.id);
    return success(res, {}, 'You are now off duty');
  } catch (err) {
    next(err);
  }
};

const getWallet = async (req, res, next) => {
  try {
    const data = await service.getWallet(req.actor.id);
    return success(res, data);
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const getInsuranceCards = async (req, res, next) => {
  try {
    const data = await service.getInsuranceCards(req.actor.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};


const listDrivers = async (req, res, next) => {
  try {
    const filters = {
      page:         parseInt(req.query.page)  || 1,
      limit:        parseInt(req.query.limit) || 20,
      sortBy:       req.query.sortBy    || 'createdAt',
      sortOrder:    req.query.sortOrder || 'desc',
      search:       req.query.search,
      status:       req.query.status       || 'all',
      isVerified:   req.query.isVerified   || 'all',
      onlineStatus: req.query.onlineStatus || 'all',
    };
    const result = await service.listDrivers(filters);
    res.set('X-Total-Count', result.total);
    res.set('X-Total-Pages', result.pages);
    return success(res, result.data, 'Drivers retrieved successfully', 200, {
      page: filters.page, limit: filters.limit, total: result.total, pages: result.pages,
    });
  } catch (err) { next(err); }
};

const getDriver = async (req, res, next) => {
  try {
    const driver = await service.getDriverDetails(req.params.driverId);
    if (!driver) return error(res, 'Driver not found', 404);
    return success(res, driver, 'Driver retrieved successfully');
  } catch (err) { next(err); }
};

const createDriver = async (req, res, next) => {
  try {
    const newDriver = await service.createDriver(req.body);
    return success(res, newDriver, 'Driver created successfully', 201);
  } catch (err) {
    if (err.message.includes('already exists')) return error(res, err.message, 409);
    next(err);
  }
};

const updateDriver = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (updateData.licenseExpiryDate) updateData.licenseExpiryDate = new Date(updateData.licenseExpiryDate);
    Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
    const updatedDriver = await service.updateDriver(req.params.driverId, updateData);
    return success(res, updatedDriver, 'Driver updated successfully');
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    if (err.message.includes('already exists')) return error(res, err.message, 409);
    next(err);
  }
};

const approveDriver = async (req, res, next) => {
  try {
    const result = await service.approveDriver(req.params.driverId, req.body.reason);
    return success(res, result, 'Driver approved successfully');
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    next(err);
  }
};

const rejectDriver = async (req, res, next) => {
  try {
    const result = await service.rejectDriver(req.params.driverId, req.body.reason);
    return success(res, result, 'Driver rejected successfully');
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    next(err);
  }
};

const suspendDriver = async (req, res, next) => {
  try {
    const { action, reason, durationDays } = req.body;
    const result = await service.suspendDriver(req.params.driverId, { action, reason, durationDays });
    return success(res, result, `Driver ${action}ed successfully`);
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    next(err);
  }
};

const issueRefund = async (req, res, next) => {
  try {
    const result = await service.issueRefund(req.params.driverId, req.body);
    return success(res, result, 'Refund issued successfully', 201);
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await service.resetPassword(req.params.driverId, req.body.newPassword);
    return success(res, null, 'Password reset successfully');
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    next(err);
  }
};

const deleteDriver = async (req, res, next) => {
  try {
    await service.deleteDriver(req.params.driverId, req.body.reason);
    return success(res, null, 'Driver account deleted successfully');
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    next(err);
  }
};


module.exports = {
  getProfile, updateProfile, updateAvatar,
  startDuty, endDuty, getWallet,
  getInsuranceCards, listDrivers, getDriver,
  createDriver, updateDriver, approveDriver, rejectDriver, 
  suspendDriver, issueRefund, resetPassword, deleteDriver
};
