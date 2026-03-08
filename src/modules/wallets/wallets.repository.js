const prisma = require('../../config/prisma');

// delta > 0 → credit, delta < 0 → debit
// reason and tripId are recorded in the transaction log
const adjustCaptainWallet = async (captainId, delta, { reason, tripId } = {}) => {
  const type = delta > 0 ? 'credit' : 'debit';
  const absAmount = Math.abs(delta);

  const wallet = await prisma.wallet.findUnique({ where: { captainId } });

  return prisma.$transaction([
    prisma.wallet.update({
      where: { captainId },
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

const findWalletByOwner = ({ userId, captainId }) =>
  prisma.wallet.findFirst({
    where: userId ? { userId } : { captainId },
  });

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
  adjustCaptainWallet,
  findWalletByOwner,
  listTransactions,
  countTransactions,
  createTransaction,
};
