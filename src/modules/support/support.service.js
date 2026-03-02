// ── SERVICE ───────────────────────────────────────────────────────────────────
const repo = require('./support.repository');

const createTicket = (actorId, role, subject) => {
  const data = role === 'user' ? { userId: actorId, subject } : { captainId: actorId, subject };
  return repo.createTicket(data);
};

const getTickets = async (actorId, role, page = 1, perPage = 20) => {
  const where = role === 'user' ? { userId: actorId } : { captainId: actorId };
  const skip = (page - 1) * perPage;
  const [tickets, total] = await repo.findTickets(where, skip, perPage);
  return { tickets, total, page, perPage };
};

const getTicketById = async (id, actorId, role) => {
  const where = role === 'user' ? { userId: actorId } : { captainId: actorId };
  const ticket = await repo.findTicketById(id, where);
  if (!ticket) throw { status: 404, message: 'Ticket not found' };
  return ticket;
};

const addMessage = (ticketId, senderId, body) => repo.addMessage(ticketId, senderId, body);

module.exports = { createTicket, getTickets, getTicketById, addMessage };
