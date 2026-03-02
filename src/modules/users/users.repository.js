const prisma = require('../../config/prisma');

const findById = (id) =>
  prisma.user.findUnique({
    where: { id },
    include: { wallet: true },
  });

const updateUser = (id, data) =>
  prisma.user.update({ where: { id }, data });

const getWallet = (userId) =>
  prisma.wallet.findUnique({ where: { userId } });

// ── Saved Addresses ───────────────────────────────────────────────────────────

const getSavedAddresses = (userId) =>
  prisma.savedAddress.findMany({ where: { userId } });

const createAddress = (data) =>
  prisma.savedAddress.create({ data });

const updateAddress = (id, userId, data) =>
  prisma.savedAddress.updateMany({ where: { id, userId }, data });

const deleteAddress = (id, userId) =>
  prisma.savedAddress.deleteMany({ where: { id, userId } });

// ── Payment Methods ───────────────────────────────────────────────────────────

const getPaymentMethods = (userId) =>
  prisma.paymentMethod.findMany({ where: { userId } });

const createPaymentMethod = (data) =>
  prisma.paymentMethod.create({ data });

const deletePaymentMethod = (id, userId) =>
  prisma.paymentMethod.deleteMany({ where: { id, userId } });

const setDefaultPayment = async (id, userId) => {
  await prisma.paymentMethod.updateMany({ where: { userId }, data: { isDefault: false } });
  return prisma.paymentMethod.updateMany({ where: { id, userId }, data: { isDefault: true } });
};

module.exports = {
  findById, updateUser, getWallet,
  getSavedAddresses, createAddress, updateAddress, deleteAddress,
  getPaymentMethods, createPaymentMethod, deletePaymentMethod, setDefaultPayment,
};
