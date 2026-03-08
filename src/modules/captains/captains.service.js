const repo          = require('./captains.repository');
const prisma        = require('../../config/prisma');
const bcrypt        = require('bcryptjs');
const locationStore = require('../../realtime/locationStore');

// ── Captain-facing ────────────────────────────────────────────────────────────
exports.getProfile = async (captainId) => {
  const captain = await repo.findById(captainId);
  if (!captain) throw { status: 404, message: 'Captain not found' };
  const { passwordHash, ...safe } = captain;
  return safe;
};

exports.updateProfile = async (captainId, data) => {
  const updated = await repo.updateCaptain(captainId, data);
  const { passwordHash, ...safe } = updated;
  return safe;
};

exports.updateAvatar = async (captainId, avatarUrl) => {
  const existing = await repo.findById(captainId);
  await repo.updateCaptain(captainId, { avatarUrl });
  return existing?.avatarUrl ?? null;
};

exports.startDuty = (captainId) =>
  repo.updateCaptain(captainId, { isOnline: true });

exports.endDuty = async (captainId) => {
  locationStore.remove(captainId);
  return repo.updateCaptain(captainId, { isOnline: false });
};

exports.getWallet = async (captainId) => {
  const wallet = await repo.getWallet(captainId);
  if (!wallet) throw { status: 404, message: 'Wallet not found' };
  return wallet;
};

exports.getInsuranceCards = (captainId) => repo.getInsuranceCards(captainId);

// ── Admin (drivers) ───────────────────────────────────────────────────────────
exports.listDrivers = async ({ page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search, status, isVerified, onlineStatus } = {}) => {
  const where = {};
  if (isVerified && isVerified !== 'all') where.isVerified = isVerified === 'verified';
  if (onlineStatus && onlineStatus !== 'all') where.isOnline = onlineStatus === 'online';
  if (search) {
    where.OR = [
      { name:           { contains: search, mode: 'insensitive' } },
      { email:          { contains: search, mode: 'insensitive' } },
      { drivingLicense: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, drivers] = await Promise.all([
    prisma.captain.count({ where }),
    prisma.captain.findMany({
      where,
      include: { vehicle: { include: { vehicleModel: true } }, wallet: true },
      orderBy: { [sortBy]: sortOrder },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
  ]);

  const data = drivers.map((d) => ({
    id:             d.id,
    name:           d.name,
    email:          d.email,
    phone:          d.phone,
    licenseNumber:  d.drivingLicense,
    vehicleType:    d.vehicle?.vehicleModel?.name || null,
    status:         d.isVerified ? 'active' : 'pending',
    rating:         d.rating,
    ridesCompleted: d.totalTrips,
  }));

  return { data, total, pages: Math.ceil(total / limit) };
};

exports.getDriverDetails = async (driverId) => {
  const driver = await prisma.captain.findUnique({
    where:   { id: driverId },
    include: {
      vehicle:         { include: { vehicleModel: true } },
      tripsAsCaptain:  true,
      ratingsReceived: true,
      wallet:          true,
      supportTickets:  true,
    },
  });
  if (!driver) return null;
  return {
    id:             driver.id,
    name:           driver.name,
    email:          driver.email,
    phone:          driver.phone,
    licenseNumber:  driver.drivingLicense,
    vehicleType:    driver.vehicle?.vehicleModel?.name || null,
    status:         driver.isVerified ? 'active' : 'pending',
    rating:         driver.rating,
    totalTrips:     driver.totalTrips,
    trips:          driver.tripsAsCaptain,
    ratings:        driver.ratingsReceived,
    wallet:         driver.wallet,
    supportTickets: driver.supportTickets,
    createdAt:      driver.createdAt,
    updatedAt:      driver.updatedAt,
  };
};

exports.createDriver = async (data) => {
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
      name:              data.name,
      email:             data.email             || null,
      phone:             data.phone             || null,
      drivingLicense:    data.drivingLicense    || null,
      licenseExpiryDate: data.licenseExpiryDate ? new Date(data.licenseExpiryDate) : null,
      isVerified:        false,
    },
  });
  return exports.getDriverDetails(created.id);
};

exports.updateDriver = async (driverId, updateData) => {
  const driver = await prisma.captain.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error('Driver not found');
  if (updateData.email && updateData.email !== driver.email) {
    const existing = await prisma.captain.findUnique({ where: { email: updateData.email } });
    if (existing) throw new Error('Email already exists');
  }
  await prisma.captain.update({ where: { id: driverId }, data: updateData });
  return exports.getDriverDetails(driverId);
};

exports.approveDriver = async (driverId, reason) => {
  const driver = await prisma.captain.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error('Driver not found');
  await prisma.captain.update({ where: { id: driverId }, data: { isVerified: true } });
  return { id: driverId, approved: true, reason: reason || null };
};

exports.rejectDriver = async (driverId, reason) => {
  const driver = await prisma.captain.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error('Driver not found');
  await prisma.captain.update({ where: { id: driverId }, data: { isVerified: false } });
  return { id: driverId, rejected: true, reason };
};

exports.suspendDriver = async (driverId, { action, reason, durationDays }) => {
  const driver = await prisma.captain.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error('Driver not found');
  const isOnline = action === 'unsuspend';
  await prisma.captain.update({ where: { id: driverId }, data: { isOnline } });
  return { id: driverId, isOnline };
};

exports.issueRefund = async (driverId, { amount, currency, tripId, reason }) => {
  const driver = await prisma.captain.findUnique({ where: { id: driverId }, include: { wallet: true } });
  if (!driver) throw new Error('Driver not found');
  if (!driver.wallet) {
    await prisma.wallet.create({ data: { captainId: driverId, balance: amount, currency } });
  } else {
    await prisma.wallet.update({ where: { id: driver.wallet.id }, data: { balance: { increment: amount } } });
  }
  return { refundId: 'REF-' + Date.now(), driverId, amount, currency, createdAt: new Date() };
};

exports.resetPassword = async (driverId, newPassword) => {
  const driver = await prisma.captain.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error('Driver not found');
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.captain.update({ where: { id: driverId }, data: { passwordHash: hash } });
};

exports.deleteDriver = async (driverId) => {
  const driver = await prisma.captain.findUnique({ where: { id: driverId } });
  if (!driver) throw new Error('Driver not found');
  await prisma.captain.delete({ where: { id: driverId } });
};
