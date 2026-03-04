const prisma = require('../../config/prisma');

const findById = (id) =>
  prisma.captain.findUnique({
    where: { id },
    include: { vehicle: { include: { vehicleModel: true } }, wallet: true },
  });

const updateCaptain = (id, data) =>
  prisma.captain.update({ where: { id }, data });

const getWallet = (captainId) =>
  prisma.wallet.findUnique({ where: { captainId } });

const getInsuranceCards = (captainId) =>
  prisma.insuranceCard.findMany({ where: { captainId } });

module.exports = {
  findById, updateCaptain, getWallet,
  getInsuranceCards,
};
