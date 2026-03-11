const prisma = require('../../config/prisma');

const findById = (id) =>
  prisma.user.findUnique({
    where: { id, role: 'driver' },
    include: { vehicle: { include: { vehicleModel: true } }, wallet: true },
  });

const updateCaptain = (id, data) =>
  prisma.user.update({ where: { id }, data });

const getWallet = (userId) =>
  prisma.wallet.findUnique({ where: { userId } });

const getInsuranceCards = (userId) =>
  prisma.insuranceCard.findMany({ where: { userId } });

module.exports = {
  findById, updateCaptain, getWallet,
  getInsuranceCards,
};
