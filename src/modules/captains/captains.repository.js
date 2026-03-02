const prisma = require('../../config/prisma');

const findById = (id) =>
  prisma.captain.findUnique({
    where: { id },
    include: { vehicle: { include: { type: true } }, wallet: true, plan: true },
  });

const updateCaptain = (id, data) =>
  prisma.captain.update({ where: { id }, data });

const getWallet = (captainId) =>
  prisma.wallet.findUnique({ where: { captainId } });

const getPricePlans = () =>
  prisma.pricePlan.findMany();

const getCaptainPlan = (captainId) =>
  prisma.captain.findUnique({ where: { id: captainId }, select: { plan: true } })
    .then(r => r?.plan ?? null);

const upsertCaptainPlan = (captainId, planId) =>
  prisma.captain.update({ where: { id: captainId }, data: { planId } });

const getInsuranceCards = (captainId) =>
  prisma.insuranceCard.findMany({ where: { captainId } });

module.exports = {
  findById, updateCaptain, getWallet,
  getPricePlans, getCaptainPlan, upsertCaptainPlan,
  getInsuranceCards,
};
