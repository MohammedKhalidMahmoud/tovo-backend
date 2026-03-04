const service = require('./payments.service');
const { success, error } = require('../../utils/response');

exports.listPayments = async (req, res, next) => {
  try {
    const filters = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      status: req.query.status,
      userId: req.query.userId,
      driverId: req.query.driverId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    };
    const result = await service.listPayments(filters);
    return success(res, result, 'Payments retrieved');
  } catch (err) {
    next(err);
  }
};

exports.refundPayment = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { amount, reason } = req.body;
    const result = await service.refundPayment(id, { amount, reason });
    return success(res, result, 'Refund processed');
  } catch (err) {
    if (err.message.includes('not found')) return error(res, err.message, 404);
    next(err);
  }
};
