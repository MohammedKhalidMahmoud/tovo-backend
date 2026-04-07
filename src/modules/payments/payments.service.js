// ════════════════════════════════════════════════════════════════════════════════
// Payments - Service
// Path: src/modules/payments/payments.service.js
// ════════════════════════════════════════════════════════════════════════════════

const repo = require('./payments.repository');

// ── List all payments (admin) ─────────────────────────────────────────────────
exports.listPayments = async (filters) => {
  const { page = 1, limit = 20, status, userId, driverId, dateFrom, dateTo, paymentType } = filters;

  const where = { status: 'completed', paymentType: 'cash' }; // payments = completed cash trips only
  if (status)      where.status      = status;
  if (userId)      where.userId      = userId;
  if (driverId)    where.driverId    = driverId;
  if (paymentType) where.paymentType = 'cash';
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
  const where = { userId, status: 'completed', paymentType: 'cash' };

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
