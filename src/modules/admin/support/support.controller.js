const service = require('./support.service');
const { success, error } = require('../../../utils/response');

exports.listComplaints = async (req, res, next) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status || 'all',
      type: req.query.type,
      search: req.query.search,
    };
    const result = await service.listComplaints(filters);
    return success(res, result, 'Complaints retrieved');
  } catch (err) {
    next(err);
  }
};

exports.getComplaint = async (req, res, next) => {
  try {
    const complaint = await service.getComplaint(req.params.id);
    if (!complaint) return error(res, 'Complaint not found', 404);
    return success(res, complaint, 'Complaint retrieved');
  } catch (err) {
    next(err);
  }
};

exports.respond = async (req, res, next) => {
  try {
    const resp = req.body.response;
    await service.respondToComplaint(req.params.id, resp);
    return success(res, null, 'Response sent');
  } catch (err) {
    next(err);
  }
};

exports.resolve = async (req, res, next) => {
  try {
    await service.resolveComplaint(req.params.id);
    return success(res, null, 'Complaint resolved');
  } catch (err) {
    next(err);
  }
};
