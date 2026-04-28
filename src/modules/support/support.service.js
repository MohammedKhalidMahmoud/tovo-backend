const repo   = require('./support.repository');
const prisma = require('../../config/prisma');

// ── Public: user/driver interactions ─────────────────────────────────────────
const validateTicketTrip = async (actorId, tripId) => {
  if (!tripId) return null;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, userId: true, driverId: true },
  });

  if (!trip) throw { status: 404, message: 'Trip not found' };
  if (trip.userId !== actorId && trip.driverId !== actorId) {
    throw { status: 403, message: 'Trip does not belong to this account' };
  }

  return trip.id;
};

const createTicket = async (actorId, subject, tripId = null) => {
  const linkedTripId = await validateTicketTrip(actorId, tripId);
  return repo.createTicket({ userId: actorId, subject, tripId: linkedTripId });
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
const listComplaints = async ({ page = 1, limit = 20, status, type, search, tripId } = {}) => {
  const where = {};
  if (status && status !== 'all') where.status = status;
  if (tripId) where.tripId = tripId;
  if (search) {
    where.OR = [
      { subject: { contains: search } },
      { messages: { some: { body: { contains: search } } } },
    ];
  }

  const total = await prisma.supportTicket.count({ where });
  const data  = await prisma.supportTicket.findMany({
    where,
    include: repo.ticketInclude,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });
  return { data, total, pages: Math.ceil(total / limit) };
};

const getComplaint = (id) => prisma.supportTicket.findUnique({ where: { id }, include: repo.ticketInclude });

const respondToComplaint = (id, response) =>
  prisma.supportTicket.update({ where: { id }, data: { response }, include: repo.ticketInclude });

const resolveComplaint = (id) =>
  prisma.supportTicket.update({ where: { id }, data: { status: 'resolved' }, include: repo.ticketInclude });

module.exports = {
  createTicket, getTickets, getTicketById, addMessage,
  listComplaints, getComplaint, respondToComplaint, resolveComplaint,
};
