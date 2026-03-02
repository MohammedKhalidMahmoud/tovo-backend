// ════════════════════════════════════════════════════════════════════════════════
// Wallets - Admin Service
// Path: src/modules/admin/wallets/wallets.service.js
// ════════════════════════════════════════════════════════════════════════════════

const prisma = require('../../../config/prisma');

const ownerInclude = {
  user:    { select: { name: true, email: true, phone: true } },
  captain: { select: { name: true, email: true, phone: true } },
};

exports.listWallets = async (filters) => {
  const { page = 1, limit = 20, ownerType = 'all', search } = filters;

  const where = {};

  if (ownerType === 'user')    where.userId    = { not: null };
  if (ownerType === 'captain') where.captainId = { not: null };

  if (search) {
    where.OR = [
      { user:    { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] } },
      { captain: { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] } },
    ];
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

  return prisma.wallet.update({
    where: { id },
    data:  { balance: type === 'credit' ? { increment: amount } : { decrement: amount } },
    include: ownerInclude,
  });
};
