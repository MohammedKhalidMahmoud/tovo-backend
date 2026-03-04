const service = require('./sos.service');
const { success } = require('../../utils/response');

exports.listAlerts = async (req, res, next) => {
  try {
    const result = await service.listAlerts({
      page:   parseInt(req.query.page)  || 1,
      limit:  parseInt(req.query.limit) || 20,
      status: req.query.status,
    });
    res.set('X-Total-Count', result.total);
    res.set('X-Total-Pages', result.pages);
    return success(res, result.data, 'SOS alerts retrieved successfully');
  } catch (err) { next(err); }
};

exports.getAlert = async (req, res, next) => {
  try {
    const alert = await service.getAlert(req.params.id);
    return success(res, alert, 'SOS alert retrieved successfully');
  } catch (err) { next(err); }
};

exports.handleAlert = async (req, res, next) => {
  try {
    const alert = await service.handleAlert(req.params.id);
    return success(res, alert, 'SOS alert marked as handled');
  } catch (err) { next(err); }
};
