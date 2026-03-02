// ── REPOSITORY ────────────────────────────────────────────────────────────────
const prisma = require('../../config/prisma');

const createTicket = (data) => prisma.supportTicket.create({ data, include: { messages: true } });
const findTickets = (where, skip, take) =>
  Promise.all([
    prisma.supportTicket.findMany({ where, include: { messages: true }, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.supportTicket.count({ where }),
  ]);
const findTicketById = (id, where) =>
  prisma.supportTicket.findFirst({ where: { id, ...where }, include: { messages: true } });
const addMessage = (ticketId, senderId, body) =>
  prisma.ticketMessage.create({ data: { ticketId, senderId, body } });

module.exports = { createTicket, findTickets, findTicketById, addMessage };
