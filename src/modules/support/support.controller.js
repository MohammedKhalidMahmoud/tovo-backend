const service = require('./support.service');
const { success, created, error, paginate } = require('../../utils/response');

const createTicket = async (req, res, next) => {
  try {
    const data = await service.createTicket(req.actor.id, req.actor.role, req.body.subject);
    return created(res, data, 'Support ticket created');
  } catch (err) { next(err); }
};

const getTickets = async (req, res, next) => {
  try {
    const { page = 1, per_page = 20 } = req.query;
    const result = await service.getTickets(req.actor.id, req.actor.role, +page, +per_page);
    return success(res, result.tickets, 'Success', 200, paginate(page, per_page, result.total));
  } catch (err) { next(err); }
};

const getTicketById = async (req, res, next) => {
  try {
    const data = await service.getTicketById(req.params.id, req.actor.id, req.actor.role);
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

module.exports = { createTicket, getTickets, getTicketById, addMessage };
