const prisma = require('../../config/prisma');

const createCommissionLog = ({ tripId, amount, paymentType, serviceId }) =>
  prisma.commissionLog.create({
    data: { tripId, amount, paymentType, serviceId: serviceId ?? null },
  });

const listCommissionLogs = async ({ dateFrom, dateTo, paymentType, serviceId, page = 1, perPage = 20 }) => {
  const where = {
    ...(paymentType && { paymentType }),
    ...(serviceId && { serviceId }),
    ...((dateFrom || dateTo) && {
      createdAt: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      },
    }),
  };

  const [logs, total] = await prisma.$transaction([
    prisma.commissionLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { trip: { select: { id: true, fare: true, status: true } } },
    }),
    prisma.commissionLog.count({ where }),
  ]);

  return { logs, total };
};

const sumCommissionLogs = async (where = {}) => {
  const result = await prisma.commissionLog.aggregate({
    _sum: { amount: true },
    where,
  });
  return parseFloat(result._sum.amount ?? 0);
};

module.exports = { createCommissionLog, listCommissionLogs, sumCommissionLogs };
