const repo   = require('./support.repository');
const prisma = require('../../config/prisma');

// ── Public: user/driver interactions ─────────────────────────────────────────
const createTicket = (actorId, subject) => {
  return repo.createTicket({ userId: actorId, subject });
};

const getTickets = async (actorId, page = 1, perPage = 20) => {
  const where = { userId: actorId };
  const skip = (page - 1) * perPage;
  const [tickets, total] = await repo.findTickets(where, skip, perPage);
  return { tickets, total, page, perPage };
};

const getTicketById = async (id, actorId) => {
  const where = { userId: actorId };
  const ticket = await repo.findTicketById(id, where);
  if (!ticket) throw { status: 404, message: 'Ticket not found' };
  return ticket;
};

const addMessage = (ticketId, senderId, body) => repo.addMessage(ticketId, senderId, body);

// ── Admin: manage all tickets ─────────────────────────────────────────────────
const listComplaints = async ({ page = 1, limit = 20, status, type, search } = {}) => {
  const where = {};
  if (status && status !== 'all') where.status = status;
  if (type)   where.type = type;
  if (search) where.message = { contains: search, mode: 'insensitive' };

  const total = await prisma.supportTicket.count({ where });
  const data  = await prisma.supportTicket.findMany({ where, skip: (page - 1) * limit, take: limit });
  return { data, total, pages: Math.ceil(total / limit) };
};

const getComplaint = (id) => prisma.supportTicket.findUnique({ where: { id } });

const respondToComplaint = (id, response) =>
  prisma.supportTicket.update({ where: { id }, data: { response } });

const resolveComplaint = (id) =>
  prisma.supportTicket.update({ where: { id }, data: { status: 'resolved' } });

module.exports = {
  createTicket, getTickets, getTicketById, addMessage,
  listComplaints, getComplaint, respondToComplaint, resolveComplaint,
};
