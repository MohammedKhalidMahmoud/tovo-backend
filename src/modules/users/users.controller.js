const service = require('./users.service');
const { success, created, error } = require('../../utils/response');
const { deleteLocalFile } = require('../../utils/uploads');

// User-facing controllers
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

const requestEmailChange = async (req, res, next) => {
  try {
    const data = await service.requestEmailChange(req.actor.id, {
      newEmail: req.body.new_email,
      currentPassword: req.body.current_password,
      baseUrl: process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`,
    });
    return success(res, data, 'Verification email sent to the new address');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await service.changePassword(req.actor.id, {
      currentPassword: req.body.current_password,
      newPassword: req.body.new_password,
    });
    return success(res, null, 'Password changed successfully');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const verifyEmailChange = async (req, res, next) => {
  try {
    const data = await service.verifyEmailChange(req.query.token);
    return success(res, data, 'Email updated successfully');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
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

const getWallet = async (req, res, next) => {
  try {
    const data = await service.getWallet(req.actor.id);
    return success(res, data);
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const getSavedAddresses = async (req, res, next) => {
  try {
    const data = await service.getSavedAddresses(req.actor.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const addAddress = async (req, res, next) => {
  try {
    const data = await service.addAddress(req.actor.id, req.body);
    return created(res, data, 'Address saved');
  } catch (err) {
    next(err);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    await service.updateAddress(req.params.id, req.actor.id, req.body);
    return success(res, {}, 'Address updated');
  } catch (err) {
    next(err);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    await service.deleteAddress(req.params.id, req.actor.id);
    return success(res, {}, 'Address deleted');
  } catch (err) {
    next(err);
  }
};

// Admin controllers
const listUsers = async (req, res, next) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      search: req.query.search,
      status: req.query.status || 'all',
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    };

    const result = await service.listUsers(filters);

    res.set('X-Total-Count', result.total);
    res.set('X-Total-Pages', result.pages);
    res.set('X-Current-Page', filters.page);
    res.set('X-Per-Page', filters.limit);

    return success(res, result.data, 'Users retrieved successfully', 200, {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      pages: result.pages,
    });
  } catch (err) {
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await service.getUserDetails(req.params.userId);
    if (!user) return error(res, 'User not found', 404);
    return success(res, user, 'User retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const newUser = await service.adminCreateUser({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      language: req.body.language || 'en',
    });
    return created(res, newUser, 'User created successfully');
  } catch (err) {
    if (err.message.includes('already exists')) return error(res, err.message, 409);
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.language !== undefined) updateData.language = req.body.language;
    if (req.body.notificationsEnabled !== undefined) updateData.notificationsEnabled = req.body.notificationsEnabled;

    const updatedUser = await service.adminUpdateUser(req.params.userId, updateData);
    return success(res, updatedUser, 'User updated successfully');
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    if (err.message.includes('already exists')) return error(res, err.message, 409);
    next(err);
  }
};

const suspendUser = async (req, res, next) => {
  try {
    const result = await service.suspendUser(req.params.userId, {
      action: req.body.action,
      reason: req.body.reason,
      durationDays: req.body.durationDays,
    });
    return success(res, result, `User ${req.body.action}ed successfully`);
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    next(err);
  }
};

const issueRefund = async (req, res, next) => {
  try {
    const result = await service.issueRefund(req.params.userId, {
      amount: req.body.amount,
      currency: req.body.currency,
      tripId: req.body.tripId,
      reason: req.body.reason,
      notes: req.body.notes,
    });
    return created(res, result, 'Refund issued successfully');
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    if (err.message.includes('insufficient')) return error(res, err.message, 422);
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await service.resetPassword(req.params.userId, req.body.newPassword);
    return success(res, null, 'Password reset successfully');
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await service.adminDeleteUser(req.params.userId, req.body.reason);
    return success(res, null, 'User account deleted successfully');
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  requestEmailChange,
  changePassword,
  verifyEmailChange,
  updateAvatar,
  getWallet,
  getSavedAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  listUsers,
  getUser,
  createUser,
  updateUser,
  suspendUser,
  issueRefund,
  resetPassword,
  deleteUser,
};
