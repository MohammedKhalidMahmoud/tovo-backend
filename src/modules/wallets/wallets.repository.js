const prisma = require('../../config/prisma');

// delta > 0 → credit, delta < 0 → debit
// reason and tripId are recorded in the transaction log
const adjustUserWallet = async (userId, delta, { reason, tripId } = {}) => {
  const type = delta > 0 ? 'credit' : 'debit';
  const absAmount = Math.abs(delta);

  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  return prisma.$transaction([
    prisma.wallet.update({
      where: { userId },
      data: {
        balance: delta > 0
          ? { increment: absAmount }
          : { decrement: absAmount },
      },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type,
        amount:   absAmount,
        reason:   reason || (type === 'credit' ? 'credit' : 'debit'),
        tripId:   tripId || null,
      },
    }),
  ]);
};

const findWalletByOwner = ({ userId }) =>
  prisma.wallet.findUnique({ where: { userId } });

const listTransactions = (walletId, { page = 1, limit = 20 } = {}) =>
  prisma.walletTransaction.findMany({
    where:   { walletId },
    orderBy: { createdAt: 'desc' },
    skip:    (page - 1) * limit,
    take:    limit,
  });

const countTransactions = (walletId) =>
  prisma.walletTransaction.count({ where: { walletId } });

const createTransaction = (data) =>
  prisma.walletTransaction.create({ data });

module.exports = {
  adjustUserWallet,
  findWalletByOwner,
  listTransactions,
  countTransactions,
  createTransaction,
};
