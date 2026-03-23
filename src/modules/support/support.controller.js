const service = require('./support.service');
const { success, created, error, notFound, paginate } = require('../../utils/response');

const createTicket = async (req, res, next) => {
  try {
    const data = await service.createTicket(req.actor.id, req.body.subject);
    return created(res, data, 'Support ticket created');
  } catch (err) { next(err); }
};

const getTickets = async (req, res, next) => {
  try {
    const { page = 1, per_page = 20 } = req.query;
    const result = await service.getTickets(req.actor.id, +page, +per_page);
    return success(res, result.tickets, 'Success', 200, paginate(page, per_page, result.total));
  } catch (err) { next(err); }
};

const getTicketById = async (req, res, next) => {
  try {
    const data = await service.getTicketById(req.params.id, req.actor.id);
    return success(res, data);
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const addMessage = async (req, res, next) => {
  try {
    const data = await service.addMessage(req.params.id, req.actor.id, req.body.body);
    return created(res, data, 'Message sent');
  } catch (err) { next(err); }
};

// ── Admin handlers ────────────────────────────────────────────────────────────

const listComplaints = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type, search } = req.query;
    const result = await service.listComplaints({ page: +page, limit: +limit, status, type, search });
    return success(res, result.data, 'Success', 200, paginate(page, limit, result.total));
  } catch (err) { next(err); }
};

const getComplaint = async (req, res, next) => {
  try {
    const data = await service.getComplaint(req.params.id);
    if (!data) return notFound(res, 'Ticket not found');
    return success(res, data);
  } catch (err) { next(err); }
};

const respondToComplaint = async (req, res, next) => {
  try {
    const data = await service.respondToComplaint(req.params.id, req.body.response);
    return success(res, data, 'Response sent');
  } catch (err) { next(err); }
};

const resolveComplaint = async (req, res, next) => {
  try {
    const data = await service.resolveComplaint(req.params.id);
    return success(res, data, 'Ticket resolved');
  } catch (err) { next(err); }
};

module.exports = { createTicket, getTickets, getTicketById, addMessage, listComplaints, getComplaint, respondToComplaint, resolveComplaint };
