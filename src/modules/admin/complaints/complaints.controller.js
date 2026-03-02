const service = require('./complaints.service');
const { success, error, notFound } = require('../../../utils/response');
const { paginate } = require('../../../utils/response');

exports.listComplaints = async (req, res, next) => {
  try {
    const result = await service.listComplaints(req.query);
    const pagination = paginate(req.query.page || 1, req.query.limit || 20, result.total);
    return success(res, result.complaints, 'Complaints retrieved', 200, pagination);
  } catch (err) {
    next(err);
  }
};

exports.getComplaintDetails = async (req, res, next) => {
  try {
    const complaint = await service.getComplaintDetails(req.params.id);
    if (!complaint) {
      return notFound(res, 'Complaint not found');
    }
    return success(res, complaint, 'Complaint details retrieved');
  } catch (err) {
    if (err.message === 'Complaint not found') {
      return notFound(res, err.message);
    }
    next(err);
  }
};

exports.respondToComplaint = async (req, res, next) => {
  try {
    const { response } = req.body;
    if (!response) {
      return error(res, 'Response message is required', 400);
    }
    // admin id from authenticated user
    const adminId = req.user && req.user.id;
    if (!adminId) {
      return error(res, 'Unable to identify admin user', 401);
    }
    const complaint = await service.respondToComplaint(req.params.id, response, adminId);
    return success(res, complaint, 'Response sent and complaint marked in_progress');
  } catch (err) {
    if (err.message === 'Complaint not found') {
      return error(res, err.message, 404);
    }
    if (err.message === 'Admin identifier missing') {
      return error(res, err.message, 500);
    }
    next(err);
  }
};

exports.updateComplaintStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return error(res, 'Status is required', 400);
    }

    const complaint = await service.updateComplaintStatus(req.params.id, status);
    return success(res, complaint, 'Complaint status updated');
  } catch (err) {
    if (err.message.includes('Invalid status')) {
      return error(res, err.message, 400);
    }
    next(err);
  }
};
exports.deleteComplaint = async (req, res, next) => {
  try {
    await service.deleteComplaint(req.params.id);
    return success(res, null, 'Complaint deleted');
  } catch (err) {
    if (err.code === 'P2025') {
      return notFound(res, 'Complaint not found');
    }
    next(err);
  }
};
