// ════════════════════════════════════════════════════════════════════════════════
// Drivers - Admin Controller
// Path: src/modules/admin/drivers/drivers.controller.js
// ════════════════════════════════════════════════════════════════════════════════

const service = require('./drivers.service');
const { success, error } = require('../../../utils/response');

/**
 * GET /api/v1/admin/drivers
 * List all drivers with filtering and pagination
 */
exports.listDrivers = async (req, res, next) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc',
      search: req.query.search,
      status: req.query.status || 'all',
      isVerified: req.query.isVerified || 'all',
      onlineStatus: req.query.onlineStatus || 'all',
    };

    const result = await service.listDrivers(filters);

    // Set pagination headers
    res.set('X-Total-Count', result.total);
    res.set('X-Total-Pages', result.pages);
    res.set('X-Current-Page', filters.page);
    res.set('X-Per-Page', filters.limit);

    return success(res, result.data, 'Drivers retrieved successfully', 200, {
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
 * GET /api/v1/admin/drivers/:driverId
 * Get detailed driver information
 */
exports.getDriver = async (req, res, next) => {
  try {
    const driverId = req.params.driverId;
    const driver = await service.getDriverDetails(driverId);

    if (!driver) {
      return error(res, 'Driver not found', 404);
    }

    return success(res, driver, 'Driver retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/admin/drivers/:driverId
 * Update driver information
 */
exports.updateDriver = async (req, res, next) => {
  try {
    const driverId = req.params.driverId;
    const updateData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      language: req.body.language,
      drivingLicense: req.body.drivingLicense,
      licenseExpiryDate: req.body.licenseExpiryDate ? new Date(req.body.licenseExpiryDate) : undefined,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const updatedDriver = await service.updateDriver(driverId, updateData);

    return success(res, updatedDriver, 'Driver updated successfully');
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
 * POST /api/v1/admin/drivers/:driverId/approve
 * Approve driver verification
 */
exports.approveDriver = async (req, res, next) => {
  try {
    const driverId = req.params.driverId;
    const reason = req.body.reason;

    const result = await service.approveDriver(driverId, reason);

    return success(res, result, 'Driver approved successfully');
  } catch (err) {
    if (err.message.includes('not found')) {
      return error(res, err.message, 404);
    }
    next(err);
  }
};

/**
 * POST /api/v1/admin/drivers/:driverId/reject
 * Reject driver application
 */
exports.rejectDriver = async (req, res, next) => {
  try {
    const driverId = req.params.driverId;
    const reason = req.body.reason;

    const result = await service.rejectDriver(driverId, reason);

    return success(res, result, 'Driver rejected successfully');
  } catch (err) {
    if (err.message.includes('not found')) {
      return error(res, err.message, 404);
    }
    next(err);
  }
};

/**
 * POST /api/v1/admin/drivers/:driverId/suspend
 * Suspend or unsuspend driver account
 */
exports.suspendDriver = async (req, res, next) => {
  try {
    const driverId = req.params.driverId;
    const { action, reason, durationDays } = req.body;

    const result = await service.suspendDriver(driverId, {
      action,
      reason,
      durationDays,
    });

    return success(res, result, `Driver ${action}ed successfully`);
  } catch (err) {
    if (err.message.includes('not found')) {
      return error(res, err.message, 404);
    }
    next(err);
  }
};

/**
 * POST /api/v1/admin/drivers/:driverId/refund
 * Issue refund to driver
 */
exports.issueRefund = async (req, res, next) => {
  try {
    const driverId = req.params.driverId;
    const refundData = {
      amount: req.body.amount,
      currency: req.body.currency,
      tripId: req.body.tripId,
      reason: req.body.reason,
      notes: req.body.notes,
    };

    const result = await service.issueRefund(driverId, refundData);

    return success(res, result, 'Refund issued successfully', 201);
  } catch (err) {
    if (err.message.includes('not found')) {
      return error(res, err.message, 404);
    }
    next(err);
  }
};

/**
 * POST /api/v1/admin/drivers/:driverId/reset-password
 * Reset driver password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const driverId = req.params.driverId;
    const { newPassword } = req.body;

    await service.resetPassword(driverId, newPassword);

    return success(res, null, 'Password reset successfully');
  } catch (err) {
    if (err.message.includes('not found')) {
      return error(res, err.message, 404);
    }
    next(err);
  }
};

/**
 * DELETE /api/v1/admin/drivers/:driverId
 * Delete driver account
 */
exports.deleteDriver = async (req, res, next) => {
  try {
    const driverId = req.params.driverId;
    const reason = req.body.reason;

    await service.deleteDriver(driverId, reason);

    return success(res, null, 'Driver account deleted successfully');
  } catch (err) {
    if (err.message.includes('not found')) {
      return error(res, err.message, 404);
    }
    next(err);
  }
};

/**
 * POST /api/v1/admin/drivers
 * Create a new driver (admin)
 */
exports.createDriver = async (req, res, next) => {
  try {
    const payload = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      drivingLicense: req.body.drivingLicense,
      licenseExpiryDate: req.body.licenseExpiryDate,
    };

    const newDriver = await service.createDriver(payload);

    return success(res, newDriver, 'Driver created successfully', 201);
  } catch (err) {
    if (err.message.includes('already exists')) return error(res, err.message, 409);
    next(err);
  }
};
