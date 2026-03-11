const repo          = require('./captains.repository');
const prisma        = require('../../config/prisma');
const bcrypt        = require('bcryptjs');
const locationStore = require('../../realtime/locationStore');

// ── Driver-facing ──────────────────────────────────────────────────────────────
exports.getProfile = async (driverId) => {
  const driver = await repo.findById(driverId);
  if (!driver) throw { status: 404, message: 'Driver not found' };
  const { passwordHash, ...safe } = driver;
  return safe;
};

exports.updateProfile = async (driverId, data) => {
  const updated = await repo.updateCaptain(driverId, data);
  const { passwordHash, ...safe } = updated;
  return safe;
};

exports.updateAvatar = async (driverId, avatarUrl) => {
  const existing = await repo.findById(driverId);
  await repo.updateCaptain(driverId, { avatarUrl });
  return existing?.avatarUrl ?? null;
};

exports.startDuty = (driverId) =>
  repo.updateCaptain(driverId, { isOnline: true });

exports.endDuty = async (driverId) => {
  locationStore.remove(driverId);
  return repo.updateCaptain(driverId, { isOnline: false });
};

exports.getWallet = async (driverId) => {
  const wallet = await repo.getWallet(driverId);
  if (!wallet) throw { status: 404, message: 'Wallet not found' };
  return wallet;
};

exports.getInsuranceCards = (driverId) => repo.getInsuranceCards(driverId);

// ── Admin (drivers) ───────────────────────────────────────────────────────────
exports.listDrivers = async ({ page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', search, status, isVerified, onlineStatus } = {}) => {
  const where = { role: 'driver' };
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
    prisma.user.count({ where }),
    prisma.user.findMany({
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
  const driver = await prisma.user.findUnique({
    where:   { id: driverId, role: 'driver' },
    include: {
      vehicle:         { include: { vehicleModel: true } },
      tripsAsDriver:   true,
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
    trips:          driver.tripsAsDriver,
    ratings:        driver.ratingsReceived,
    wallet:         driver.wallet,
    supportTickets: driver.supportTickets,
    createdAt:      driver.createdAt,
    updatedAt:      driver.updatedAt,
  };
};

exports.createDriver = async (data) => {
  if (data.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email already exists');
  }
  if (data.phone) {
    const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing) throw new Error('Phone number already exists');
  }
  const created = await prisma.user.create({
    data: {
      name:              data.name,
      email:             data.email             || null,
      phone:             data.phone             || null,
      drivingLicense:    data.drivingLicense    || null,
      licenseExpiryDate: data.licenseExpiryDate ? new Date(data.licenseExpiryDate) : null,
      isVerified:        false,
      role:              'driver',
    },
  });
  return exports.getDriverDetails(created.id);
};

exports.updateDriver = async (driverId, updateData) => {
  const driver = await prisma.user.findUnique({ where: { id: driverId, role: 'driver' } });
  if (!driver) throw new Error('Driver not found');
  if (updateData.email && updateData.email !== driver.email) {
    const existing = await prisma.user.findUnique({ where: { email: updateData.email } });
    if (existing) throw new Error('Email already exists');
  }
  await prisma.user.update({ where: { id: driverId }, data: updateData });
  return exports.getDriverDetails(driverId);
};

exports.approveDriver = async (driverId, reason) => {
  const driver = await prisma.user.findUnique({ where: { id: driverId, role: 'driver' } });
  if (!driver) throw new Error('Driver not found');
  await prisma.user.update({ where: { id: driverId }, data: { isVerified: true } });
  return { id: driverId, approved: true, reason: reason || null };
};

exports.rejectDriver = async (driverId, reason) => {
  const driver = await prisma.user.findUnique({ where: { id: driverId, role: 'driver' } });
  if (!driver) throw new Error('Driver not found');
  await prisma.user.update({ where: { id: driverId }, data: { isVerified: false } });
  return { id: driverId, rejected: true, reason };
};

exports.suspendDriver = async (driverId, { action, reason, durationDays }) => {
  const driver = await prisma.user.findUnique({ where: { id: driverId, role: 'driver' } });
  if (!driver) throw new Error('Driver not found');
  const isOnline = action === 'unsuspend';
  await prisma.user.update({ where: { id: driverId }, data: { isOnline } });
  return { id: driverId, isOnline };
};

exports.issueRefund = async (driverId, { amount, currency, tripId, reason }) => {
  const driver = await prisma.user.findUnique({ where: { id: driverId, role: 'driver' }, include: { wallet: true } });
  if (!driver) throw new Error('Driver not found');
  if (!driver.wallet) {
    await prisma.wallet.create({ data: { userId: driverId, balance: amount, currency } });
  } else {
    await prisma.wallet.update({ where: { id: driver.wallet.id }, data: { balance: { increment: amount } } });
  }
  return { refundId: 'REF-' + Date.now(), driverId, amount, currency, createdAt: new Date() };
};

exports.resetPassword = async (driverId, newPassword) => {
  const driver = await prisma.user.findUnique({ where: { id: driverId, role: 'driver' } });
  if (!driver) throw new Error('Driver not found');
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: driverId }, data: { passwordHash: hash } });
};

exports.deleteDriver = async (driverId) => {
  const driver = await prisma.user.findUnique({ where: { id: driverId, role: 'driver' } });
  if (!driver) throw new Error('Driver not found');
  await prisma.user.delete({ where: { id: driverId } });
};
