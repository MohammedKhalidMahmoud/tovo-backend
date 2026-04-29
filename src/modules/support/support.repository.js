// ── REPOSITORY ────────────────────────────────────────────────────────────────
const prisma = require('../../config/prisma');

const ticketInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  messages: {
    orderBy: { createdAt: 'asc' },
  },
  trip: {
    select: {
      id: true,
      status: true,
      pickupAddress: true,
      dropoffAddress: true,
      createdAt: true,
    },
  },
};

const createTicket = (data) => prisma.supportTicket.create({ data, include: ticketInclude });
const findTickets = (where, skip, take) =>
  Promise.all([
    prisma.supportTicket.findMany({ where, include: ticketInclude, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.supportTicket.count({ where }),
  ]);
const findTicketById = (id, where) =>
  prisma.supportTicket.findFirst({ where: { id, ...where }, include: ticketInclude });
const addMessage = (ticketId, senderId, body) =>
  prisma.ticketMessage.create({ data: { ticketId, senderId, body } });

module.exports = { ticketInclude, createTicket, findTickets, findTicketById, addMessage };
