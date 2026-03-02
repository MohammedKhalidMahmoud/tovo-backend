const prisma = require('../../../config/prisma');

exports.listPayments = async (filters) => {
  const { page = 1, limit = 20, status, userId, driverId, dateFrom, dateTo } = filters;
  const where = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (driverId) where.captainId = driverId;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }
  const total = await prisma.trip.count({ where });
  const data = await prisma.trip.findMany({ where, skip: (page - 1) * limit, take: limit });
  return { data, total, pages: Math.ceil(total / limit) };
};

exports.refundPayment = async (id, data) => {
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) throw new Error('Ride not found');
  // simple refund: issue wallet credit
  const user = await prisma.user.findUnique({ where: { id: trip.userId }, include: { wallet: true } });
  if (!user) throw new Error('User not found');
  let wallet = user.wallet;
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId: user.id, balance: data.amount, currency: 'EGP' } });
  } else {
    await prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: data.amount } } });
  }
  return { success: true, amount: data.amount };
};