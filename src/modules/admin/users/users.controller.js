// ════════════════════════════════════════════════════════════════════════════════
// Users - Admin Controller
// Path: src/modules/admin/users/users.controller.js
// ════════════════════════════════════════════════════════════════════════════════

const service = require('./users.service');
const { success, error } = require('../../../utils/response');

/**
 * GET /api/v1/admin/users
 * List all users with filtering and pagination
 */
exports.listUsers = async (req, res, next) => {
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

    // Set pagination headers
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

/**
 * GET /api/v1/admin/users/:userId
 * Get detailed user information
 */
exports.getUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await service.getUserDetails(userId);

    if (!user) {
      return error(res, 'User not found', 404);
    }

    return success(res, user, 'User retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/admin/users/:userId
 * Update user information
 */
exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const updateData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      language: req.body.language,
      notificationsEnabled: req.body.notificationsEnabled,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const updatedUser = await service.updateUser(userId, updateData);

    return success(res, updatedUser, 'User updated successfully');
  } catch (err) {
    if (err.message.includes('not found')) {
      return error(res, err.message, 404);
    }
    if (err.message.includes('already exists')) {
      return error(res, err.message, 409);
    }
    next(err);
  }
};

/**
 * POST /api/v1/admin/users/:userId/suspend
 * Suspend or unsuspend user account
 */
exports.suspendUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { action, reason, durationDays } = req.body;

    const result = await service.suspendUser(userId, {
      action,
      reason,
      durationDays,
    });

    return success(res, result, `User ${action}ed successfully`);
  } catch (err) {
    if (err.message.includes('not found')) {
      return error(res, err.message, 404);
    }
    next(err);
  }
};

/**
 * POST /api/v1/admin/users/:userId/refund
 * Issue refund to user
 */
exports.issueRefund = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const refundData = {
      amount: req.body.amount,
      currency: req.body.currency,
      tripId: req.body.tripId,
      reason: req.body.reason,
      notes: req.body.notes,
    };

    const result = await service.issueRefund(userId, refundData);

    return success(res, result, 'Refund issued successfully', null, 201);
  } catch (err) {
    if (err.message.includes('not found')) {
      return error(res, err.message, 404);
    }
    if (err.message.includes('insufficient')) {
      return error(res, err.message, 422);
    }
    next(err);
  }
};

/**
 * POST /api/v1/admin/users/:userId/reset-password
 * Reset user password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { newPassword } = req.body;

    await service.resetPassword(userId, newPassword);

    return success(res, null, 'Password reset successfully');
  } catch (err) {
    if (err.message.includes('not found')) {
      return error(res, err.message, 404);
    }
    next(err);
  }
};

/**
 * DELETE /api/v1/admin/users/:userId
 * Delete user account
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const reason = req.body.reason;

    await service.deleteUser(userId, reason);

    return success(res, null, 'User account deleted successfully');
  } catch (err) {
    if (err.message.includes('not found')) {
      return error(res, err.message, 404);
    }
    next(err);
  }
};

/**
 * POST /api/v1/admin/users
 * Create a new user
 */
exports.createUser = async (req, res, next) => {
  try {
    const payload = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      language: req.body.language || 'en',
    };

    const newUser = await service.createUser(payload);

    return success(res, newUser, 'User created successfully', 201);
  } catch (err) {
    if (err.message.includes('already exists')) return error(res, err.message, 409);
    next(err);
  }
};
