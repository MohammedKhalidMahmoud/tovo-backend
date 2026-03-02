const repository = require('./complaints.repository');

exports.listComplaints = async (query) => {
  const { page = 1, limit = 20, status, userId, captainId } = query;
  const filters = {};

  if (status) filters.status = status;
  if (userId) filters.userId = userId;
  if (captainId) filters.captainId = captainId;

  return repository.findAll(filters, { page: parseInt(page), limit: parseInt(limit) });
};

exports.getComplaintDetails = async (id) => {
  const complaint = await repository.findById(id);
  if (!complaint) {
    throw new Error('Complaint not found');
  }
  return complaint;
};

exports.respondToComplaint = async (id, message, adminId) => {
  if (!adminId) {
    throw new Error('Admin identifier missing');
  }

  const complaint = await repository.findById(id);
  if (!complaint) {
    throw new Error('Complaint not found');
  }
  // create a message and bump status to in_progress
  await repository.createMessage(id, adminId, message);
  return repository.updateStatus(id, 'in_progress');
};

exports.updateComplaintStatus = async (id, status) => {
  const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  return repository.updateStatus(id, status);
};
exports.deleteComplaint = async (id) => {
  return repository.deleteComplaint(id);
};
