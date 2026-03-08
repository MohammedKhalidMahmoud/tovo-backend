// ════════════════════════════════════════════════════════════════════════════════
// Payments - Repository
// Path: src/modules/payments/payments.repository.js
// ════════════════════════════════════════════════════════════════════════════════

const prisma = require('../../config/prisma');

const tripInclude = {
  user:          { select: { id: true, name: true, email: true, phone: true } },
  captain:       { select: { id: true, name: true, email: true, phone: true } },
  service:       { select: { id: true, name: true } },
  paymentMethod: { select: { brand: true, lastFour: true, maskedNumber: true } },
};

const findTripById = (id) =>
  prisma.trip.findUnique({ where: { id }, include: tripInclude });

const listTrips = (where, { page = 1, limit = 20 } = {}) =>
  prisma.trip.findMany({
    where,
    include: tripInclude,
    skip:    (page - 1) * limit,
    take:    limit,
    orderBy: { createdAt: 'desc' },
  });

const countTrips = (where) => prisma.trip.count({ where });

// Check if a refund wallet transaction already exists for a given tripId
const findRefundTransaction = (tripId) =>
  prisma.walletTransaction.findFirst({
    where: { tripId, type: 'credit', reason: 'refund' },
  });

module.exports = { findTripById, listTrips, countTrips, findRefundTransaction };
