// ════════════════════════════════════════════════════════════════════════════════
// Payments - Controller
// Path: src/modules/payments/payments.controller.js
// ════════════════════════════════════════════════════════════════════════════════

const service = require('./payments.service');
const { success, error } = require('../../utils/response');

/**
 * GET /api/v1/admin/payments
 * Admin: list all completed payments with filters
 */
exports.listPayments = async (req, res, next) => {
  try {
    const filters = {
      page:        req.query.page  || 1,
      limit:       req.query.limit || 20,
      status:      req.query.status,
      userId:      req.query.userId,
      driverId:    req.query.driverId,
      paymentType: req.query.paymentType,
      dateFrom:    req.query.dateFrom,
      dateTo:      req.query.dateTo,
    };
    const result = await service.listPayments(filters);
    return success(res, result.data, 'Payments retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/payments/me
 * User: own payment history (completed trips)
 */
exports.listMyPayments = async (req, res, next) => {
  try {
    const filters = { page: req.query.page || 1, limit: req.query.limit || 20 };
    const result = await service.listMyPayments(req.actor.id, filters);
    return success(res, result.data, 'Payments retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/payments/:id
 * User (own) or Admin (any): single payment detail
 */
exports.getPayment = async (req, res, next) => {
  try {
    const payment = await service.getPayment(req.params.id, req.actor);
    return success(res, payment, 'Payment retrieved');
  } catch (err) {
    next(err);
  }
};
