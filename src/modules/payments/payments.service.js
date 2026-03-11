// ════════════════════════════════════════════════════════════════════════════════
// Payments - Service
// Path: src/modules/payments/payments.service.js
// ════════════════════════════════════════════════════════════════════════════════

const prisma = require('../../config/prisma');
const repo = require('./payments.repository');

// ── List all payments (admin) ─────────────────────────────────────────────────
exports.listPayments = async (filters) => {
  const { page = 1, limit = 20, status, userId, driverId, dateFrom, dateTo, paymentType } = filters;

  const where = { status: 'completed' };               // payments = completed trips only
  if (status)      where.status      = status;
  if (userId)      where.userId      = userId;
  if (driverId)    where.driverId    = driverId;
  if (paymentType) where.paymentType = paymentType;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo)   where.createdAt.lte = new Date(dateTo);
  }

  const [total, data] = await Promise.all([
    repo.countTrips(where),
    repo.listTrips(where, { page: Number(page), limit: Number(limit) }),
  ]);

  return { data, total, pages: Math.ceil(total / limit) };
};

// ── List own payments (user) ──────────────────────────────────────────────────
exports.listMyPayments = async (userId, filters) => {
  const { page = 1, limit = 20 } = filters;
  const where = { userId, status: 'completed' };

  const [total, data] = await Promise.all([
    repo.countTrips(where),
    repo.listTrips(where, { page: Number(page), limit: Number(limit) }),
  ]);

  return { data, total, pages: Math.ceil(total / limit) };
};

// ── Get single payment ────────────────────────────────────────────────────────
exports.getPayment = async (id, actor) => {
  const trip = await repo.findTripById(id);
  if (!trip) throw Object.assign(new Error('Payment not found'), { statusCode: 404 });

  // users can only see their own payments
  if (actor.role === 'customer' && trip.userId !== actor.id)
    throw Object.assign(new Error('Access denied'), { statusCode: 403 });

  return trip;
};

// ── Issue refund (admin) ──────────────────────────────────────────────────────
exports.refundPayment = async (id, { amount, reason }) => {
  const trip = await repo.findTripById(id);
  if (!trip) throw Object.assign(new Error('Payment not found'), { statusCode: 404 });

  // Guard: trip must be completed
  if (trip.status !== 'completed')
    throw Object.assign(new Error('Can only refund completed trips'), { statusCode: 422 });

  // Guard: only card payments were collected by the platform
  if (trip.paymentType !== 'card')
    throw Object.assign(new Error('Only card payments can be refunded via wallet'), { statusCode: 422 });

  // Guard: amount must not exceed original fare
  if (parseFloat(amount) > parseFloat(trip.fare))
    throw Object.assign(new Error(`Refund amount cannot exceed the original fare of ${trip.fare}`), { statusCode: 422 });

  // Guard: no duplicate refund
  const existing = await repo.findRefundTransaction(id);
  if (existing)
    throw Object.assign(new Error('This payment has already been refunded'), { statusCode: 409 });

  // Credit the user's wallet and log the transaction atomically
  const userWallet = await prisma.wallet.findUnique({ where: { userId: trip.userId } });
  if (!userWallet) throw Object.assign(new Error('User wallet not found'), { statusCode: 404 });

  await prisma.$transaction([
    prisma.wallet.update({
      where: { id: userWallet.id },
      data:  { balance: { increment: parseFloat(amount) } },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: userWallet.id,
        type:     'credit',
        amount:   parseFloat(amount),
        reason:   'refund',
        tripId:   id,
      },
    }),
  ]);

  return { tripId: id, refundedAmount: amount, reason };
};
