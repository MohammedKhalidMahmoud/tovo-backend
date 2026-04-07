const prisma = require('../../config/prisma');

// User
const findById = (id) =>
  prisma.user.findUnique({
    where: { id },
    include: { wallet: true },
  });

const findByEmail = (email) =>
  prisma.user.findUnique({ where: { email } });

const findByPhone = (phone) =>
  prisma.user.findUnique({ where: { phone } });

const createUser = (data) =>
  prisma.user.create({ data });

const updateUser = (id, data) =>
  prisma.user.update({ where: { id }, data });

const deleteUser = (id) =>
  prisma.user.delete({ where: { id } });

const countUsers = (where) =>
  prisma.user.count({ where });

const findManyUsers = ({ where, orderBy, skip, take }) =>
  prisma.user.findMany({
    where,
    include: {
      wallet: true,
      tripsAsCustomer: { select: { id: true } },
      ratingsGiven: { select: { stars: true } },
    },
    orderBy,
    skip,
    take,
  });

const findUserWithDetails = (id) =>
  prisma.user.findUnique({
    where: { id },
    include: {
      wallet: true,
      savedAddresses: true,
      deviceTokens: true,
      tripsAsCustomer: { select: { id: true, status: true, finalFare: true, createdAt: true } },
      ratingsGiven: true,
      supportTickets: { select: { id: true, status: true } },
    },
  });

// Wallet
const getWallet = (userId) =>
  prisma.wallet.findUnique({ where: { userId } });

const createWallet = (data) =>
  prisma.wallet.create({ data });

const incrementWalletBalance = (walletId, amount) =>
  prisma.wallet.update({
    where: { id: walletId },
    data: { balance: { increment: amount } },
  });

// Saved Addresses
const getSavedAddresses = (userId) =>
  prisma.savedAddress.findMany({ where: { userId } });

const createAddress = (data) =>
  prisma.savedAddress.create({ data });

const updateAddress = (id, userId, data) =>
  prisma.savedAddress.updateMany({ where: { id, userId }, data });

const deleteAddress = (id, userId) =>
  prisma.savedAddress.deleteMany({ where: { id, userId } });

module.exports = {
  findById,
  findByEmail,
  findByPhone,
  createUser,
  updateUser,
  deleteUser,
  countUsers,
  findManyUsers,
  findUserWithDetails,
  getWallet,
  createWallet,
  incrementWalletBalance,
  getSavedAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};
