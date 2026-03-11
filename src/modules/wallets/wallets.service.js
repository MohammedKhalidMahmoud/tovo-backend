// ════════════════════════════════════════════════════════════════════════════════
// Wallets - Service
// Path: src/modules/wallets/wallets.service.js
// ════════════════════════════════════════════════════════════════════════════════

const prisma = require('../../config/prisma');
const { findWalletByOwner, listTransactions, countTransactions, createTransaction, adjustUserWallet } = require('./wallets.repository');
const tripsRepository = require('../trips/trips.repository');

const ownerInclude = {
  user: { select: { id: true, name: true, email: true, phone: true, role: true } },
};

exports.getMyWallet = async (actorId) => {
  const wallet = await findWalletByOwner({ userId: actorId });
  if (!wallet) throw Object.assign(new Error('Wallet not found'), { statusCode: 404 });
  return wallet;
};

exports.listWallets = async (filters) => {
  const { page = 1, limit = 20, ownerType = 'all', search } = filters;

  const where = {};

  if (ownerType === 'customer') where.user = { role: 'customer' };
  if (ownerType === 'driver')   where.user = { role: 'driver' };

  if (search) {
    where.user = { ...where.user, OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] };
  }

  const [total, data] = await Promise.all([
    prisma.wallet.count({ where }),
    prisma.wallet.findMany({
      where,
      include: ownerInclude,
      skip:  (page - 1) * limit,
      take:  limit,
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  return { data, total, pages: Math.ceil(total / limit) };
};

exports.getWallet = async (id) => {
  const wallet = await prisma.wallet.findUnique({ where: { id }, include: ownerInclude });
  if (!wallet) throw Object.assign(new Error('Wallet not found'), { statusCode: 404 });
  return wallet;
};

exports.adjustWallet = async (id, { type, amount, reason }) => {
  if (!['credit', 'debit'].includes(type))
    throw Object.assign(new Error('type must be "credit" or "debit"'), { statusCode: 400 });

  if (!amount || amount <= 0)
    throw Object.assign(new Error('amount must be a positive number'), { statusCode: 400 });

  if (!reason || !reason.trim())
    throw Object.assign(new Error('reason is required'), { statusCode: 400 });

  const wallet = await prisma.wallet.findUnique({ where: { id } });
  if (!wallet) throw Object.assign(new Error('Wallet not found'), { statusCode: 404 });

  if (type === 'debit' && parseFloat(wallet.balance) < amount)
    throw Object.assign(new Error('Insufficient wallet balance'), { statusCode: 422 });

  const [updated] = await prisma.$transaction([
    prisma.wallet.update({
      where: { id },
      data:  { balance: type === 'credit' ? { increment: amount } : { decrement: amount } },
      include: ownerInclude,
    }),
    prisma.walletTransaction.create({
      data: { walletId: id, type, amount, reason: reason.trim() },
    }),
  ]);

  return updated;
};

exports.listMyTransactions = async (actorId, { page = 1, limit = 20 } = {}) => {
  const wallet = await findWalletByOwner({ userId: actorId });
  if (!wallet) throw Object.assign(new Error('Wallet not found'), { statusCode: 404 });

  const [total, data] = await Promise.all([
    countTransactions(wallet.id),
    listTransactions(wallet.id, { page, limit }),
  ]);

  return { data, total, pages: Math.ceil(total / limit) };
};

exports.listWalletTransactions = async (walletId, { page = 1, limit = 20 } = {}) => {
  const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
  if (!wallet) throw Object.assign(new Error('Wallet not found'), { statusCode: 404 });

  const [total, data] = await Promise.all([
    countTransactions(walletId),
    listTransactions(walletId, { page, limit }),
  ]);

  return { data, total, pages: Math.ceil(total / limit) };
};

// ─────────────────────────────────────────────────────────────────────────────
//  DRIVER CREDIT CUSTOMER WALLET FROM TRIP
// ─────────────────────────────────────────────────────────────────────────────
exports.creditCustomerWalletFromTrip = async (driverId, tripId, amount) => {
  // Validate amount
  amount = parseFloat(amount);
  if (!amount || amount <= 0)
    throw Object.assign(new Error('amount must be a positive number'), { statusCode: 400 });

  // Lookup trip
  const trip = await tripsRepository.findTripById(tripId);
  if (!trip) throw Object.assign(new Error('Trip not found'), { statusCode: 404 });

  // Verify trip is completed
  if (trip.status !== 'completed')
    throw Object.assign(new Error('Trip must be completed to credit customer wallet'), { statusCode: 422 });

  // Verify driver owns the trip
  if (trip.driverId !== driverId)
    throw Object.assign(new Error('Access denied — trip does not belong to this driver'), { statusCode: 403 });

  // Credit customer wallet atomically
  const [updated] = await adjustUserWallet(trip.userId, +amount, {
    reason: 'driver_credit',
    tripId,
  });

  return updated;
};
