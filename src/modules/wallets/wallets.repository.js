const prisma = require('../../config/prisma');

// delta > 0 → credit, delta < 0 → debit
const adjustCaptainWallet = (captainId, delta) =>
  prisma.wallet.update({
    where: { captainId },
    data: {
      balance: delta > 0
        ? { increment: Math.abs(delta) }
        : { decrement: Math.abs(delta) },
    },
  });

module.exports = { adjustCaptainWallet };
