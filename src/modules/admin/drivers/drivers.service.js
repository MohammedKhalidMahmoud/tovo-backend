const prisma = require('../../../config/prisma');
const bcrypt = require('bcryptjs');

/**
 * List drivers with filters and pagination
 */
exports.listDrivers = async (filters) => {
  const { page, limit, sortBy, sortOrder, search, status, isVerified, onlineStatus } = filters;

  const where = {};

  if (status && status !== 'all') {
    if (status === 'suspended') where.isOnline = false; // simple mapping
  }

  if (isVerified && isVerified !== 'all') {
    where.isVerified = isVerified === 'verified';
  }

  if (onlineStatus && onlineStatus !== 'all') {
    where.isOnline = onlineStatus === 'online';
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { drivingLicense: { contains: search, mode: 'insensitive' } },
    ];
  }

  const total = await prisma.captain.count({ where });

  const drivers = await prisma.captain.findMany({
    where,
    include: { vehicle: { include: { vehicleModel: true } }, wallet: true },
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
  });

  const transformed = drivers.map((d) => ({
    id: d.id,
    name: d.name,
    email: d.email,
    phone: d.phone,
    licenseNumber: d.drivingLicense,
    vehicleType: d.vehicle?.vehicleModel?.name || null,
    status: d.isVerified ? 'active' : 'pending',
    rating: d.rating,
    ridesCompleted: d.totalTrips,
  }));

  return { data: transformed, total, pages: Math.ceil(total / limit) };
};

/**
 * Get driver details
 */
exports.getDriverDetails = async (driverId) => {
  const driver = await prisma.captain.findUnique({
    where: { id: driverId },
    include: {
      vehicle: { include: { vehicleModel: true } },
      tripsAsCaptain: true,
      ratingsReceived: true,
      wallet: true,
      supportTickets: true,
    },
  });

  if (!driver) return null;

  return {
    id: driver.id,
    name: driver.name,
    email: driver.email,
    phone: driver.phone,
    licenseNumber: driver.drivingLicense,
    vehicleType: driver.vehicle?.vehicleModel?.name || null,
    status: driver.isVerified ? 'active' : 'pending',
    rating: driver.rating,
    totalTrips: driver.totalTrips,
    trips: driver.tripsAsCaptain,
    ratings: driver.ratingsReceived,
    wallet: driver.wallet,
    supportTickets: driver.supportTickets,
    createdAt: driver.createdAt,
    updatedAt: driver.updatedAt,
  };
};

/**
 * Update driver
 */
exports.updateDriver = async (driverId, updateData) => {
  const driver = await prisma.captain.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error('Driver not found');

  if (updateData.email && updateData.email !== driver.email) {
    const existing = await prisma.captain.findUnique({ where: { email: updateData.email } });
    if (existing) throw new Error('Email already exists');
  }

  const updated = await prisma.captain.update({ where: { id: driverId }, data: updateData });
  return exports.getDriverDetails(updated.id);
};

/**
 * Approve driver
 */
exports.approveDriver = async (driverId, reason) => {
  const driver = await prisma.captain.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error('Driver not found');

  await prisma.captain.update({ where: { id: driverId }, data: { isVerified: true } });

  return { id: driverId, approved: true, reason: reason || null };
};

/**
 * Reject driver
 */
exports.rejectDriver = async (driverId, reason) => {
  const driver = await prisma.captain.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error('Driver not found');

  await prisma.captain.update({ where: { id: driverId }, data: { isVerified: false } });

  return { id: driverId, rejected: true, reason };
};

/**
 * Suspend/unsuspend driver
 */
exports.suspendDriver = async (driverId, data) => {
  const driver = await prisma.captain.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error('Driver not found');

  const isOnline = data.action === 'unsuspend' ? true : false;

  await prisma.captain.update({ where: { id: driverId }, data: { isOnline } });

  return { id: driverId, isOnline };
};

/**
 * Issue refund to driver wallet
 */
exports.issueRefund = async (driverId, refundData) => {
  const driver = await prisma.captain.findUnique({ where: { id: driverId }, include: { wallet: true } });
  if (!driver) throw new Error('Driver not found');

  let wallet = driver.wallet;
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { captainId: driverId, balance: refundData.amount, currency: refundData.currency } });
  } else {
    wallet = await prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: refundData.amount } } });
  }

  return { refundId: 'REF-' + Date.now(), driverId, amount: refundData.amount, currency: refundData.currency, createdAt: new Date() };
};

/**
 * Reset driver password
 */
exports.resetPassword = async (driverId, newPassword) => {
  const driver = await prisma.captain.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error('Driver not found');

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.captain.update({ where: { id: driverId }, data: { passwordHash: hash } });
};

/**
 * Delete driver
 */
exports.deleteDriver = async (driverId, reason) => {
  const driver = await prisma.captain.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error('Driver not found');

  await prisma.captain.delete({ where: { id: driverId } });
};

/**
 * Create a new driver (admin)
 */
exports.createDriver = async (data) => {
  // check duplicates
  if (data.email) {
    const existing = await prisma.captain.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email already exists');
  }

  if (data.phone) {
    const existing = await prisma.captain.findUnique({ where: { phone: data.phone } });
    if (existing) throw new Error('Phone number already exists');
  }

  const created = await prisma.captain.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      drivingLicense: data.drivingLicense || null,
      licenseExpiryDate: data.licenseExpiryDate ? new Date(data.licenseExpiryDate) : null,
      isVerified: false,
    },
  });

  return exports.getDriverDetails(created.id);
};
