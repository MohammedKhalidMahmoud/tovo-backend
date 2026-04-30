const repo = require('./drivers.repository');
const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const locationStore = require('../../realtime/locationStore');

const DRIVER_PROFILE_FIELDS = new Set([
  'drivingLicense',
  'licenseExpiryDate',
  'isOnline',
  'rating',
  'totalTrips',
  'serviceId',
]);

const splitDriverUpdateData = (data = {}) => {
  const userData = {};
  const profileData = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) return;
    if (DRIVER_PROFILE_FIELDS.has(key)) profileData[key] = value;
    else userData[key] = value;
  });

  return { userData, profileData };
};

const withDriverProfileFields = (driver) => {
  if (!driver) return driver;

  const profile = driver.driverProfile || null;
  const { driverProfile, ...safe } = driver;

  return {
    ...safe,
    drivingLicense: profile?.drivingLicense ?? null,
    licenseExpiryDate: profile?.licenseExpiryDate ?? null,
    isOnline: profile?.isOnline ?? false,
    rating: profile?.rating ?? 0,
    totalTrips: profile?.totalTrips ?? 0,
    serviceId: profile?.serviceId ?? null,
  };
};

const findDriver = (driverId, include = {}) =>
  prisma.user.findFirst({
    where: { id: driverId, role: 'driver' },
    include,
  });

exports.getProfile = async (driverId) => {
  const driver = await repo.findById(driverId);
  if (!driver) throw { status: 404, message: 'Driver not found' };
  const { passwordHash, ...safe } = withDriverProfileFields(driver);
  return safe;
};

exports.updateProfile = async (driverId, data) => {
  const updated = await repo.updateDriver(driverId, data);
  const { passwordHash, ...safe } = withDriverProfileFields(updated);
  return safe;
};

exports.updateAvatar = async (driverId, avatarUrl) => {
  const existing = await repo.findById(driverId);
  await repo.updateDriver(driverId, { avatarUrl });
  return existing?.avatarUrl ?? null;
};

exports.startDuty = async (driverId, { latitude, longitude, heading = null } = {}) => {
  const driver = await repo.findById(driverId);
  if (!driver) throw { status: 404, message: 'Driver not found' };

  const hadLocation = locationStore.has(driverId);
  if (!hadLocation) {
    await repo.updateDriver(driverId, { isOnline: true });
  }

  locationStore.set(driverId, {
    lat: Number(latitude),
    lng: Number(longitude),
    heading,
    serviceId: driver.driverProfile?.serviceId ?? null,
  });
};

exports.endDuty = async (driverId) => {
  locationStore.remove(driverId);
  return repo.updateDriver(driverId, { isOnline: false });
};

exports.getWallet = async (driverId) => {
  const wallet = await repo.getWallet(driverId);
  if (!wallet) throw { status: 404, message: 'Wallet not found' };
  return wallet;
};

exports.getInsuranceCards = (driverId) => repo.getInsuranceCards(driverId);

exports.listDrivers = async ({
  page = 1,
  limit = 20,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  search,
  status,
  isVerified,
  onlineStatus,
} = {}) => {
  const where = { role: 'driver' };
  if (isVerified && isVerified !== 'all') where.isVerified = isVerified === 'verified';
  if (onlineStatus && onlineStatus !== 'all') {
    where.driverProfile = { is: { isOnline: onlineStatus === 'online' } };
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { driverProfile: { is: { drivingLicense: { contains: search } } } },
    ];
  }

  let orderBy = { createdAt: sortOrder };
  if (sortBy === 'rating' || sortBy === 'totalTrips') {
    orderBy = { driverProfile: { [sortBy]: sortOrder } };
  } else if (['createdAt', 'updatedAt', 'name', 'email'].includes(sortBy)) {
    orderBy = { [sortBy]: sortOrder };
  }

  const [total, drivers] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { vehicle: { include: { vehicleModel: true } }, wallet: true, driverProfile: true },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const data = drivers.map((d) => ({
    id: d.id,
    name: d.name,
    email: d.email,
    phone: d.phone,
    licenseNumber: d.driverProfile?.drivingLicense ?? null,
    vehicleType: d.vehicle?.vehicleModel?.name || null,
    status: d.isVerified ? 'active' : 'pending',
    rating: d.driverProfile?.rating ?? 0,
    ridesCompleted: d.driverProfile?.totalTrips ?? 0,
  }));

  return { data, total, pages: Math.ceil(total / limit) };
};

exports.getDriverDetails = async (driverId) => {
  const driver = await findDriver(driverId, {
    driverProfile: true,
    vehicle: { include: { vehicleModel: true } },
    tripsAsDriver: true,
    ratingsReceived: true,
    wallet: true,
    supportTickets: true,
  });
  if (!driver) return null;

  const withProfile = withDriverProfileFields(driver);

  return {
    id: withProfile.id,
    name: withProfile.name,
    email: withProfile.email,
    phone: withProfile.phone,
    licenseNumber: withProfile.drivingLicense,
    vehicleType: withProfile.vehicle?.vehicleModel?.name || null,
    status: withProfile.isVerified ? 'active' : 'pending',
    rating: withProfile.rating,
    totalTrips: withProfile.totalTrips,
    trips: withProfile.tripsAsDriver,
    ratings: withProfile.ratingsReceived,
    wallet: withProfile.wallet,
    supportTickets: withProfile.supportTickets,
    createdAt: withProfile.createdAt,
    updatedAt: withProfile.updatedAt,
  };
};

exports.createDriver = async (data) => {
  if (!data.email) throw new Error('Email is required');

  if (data.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email already exists');
  }
  if (data.phone) {
    const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existing) throw new Error('Phone number already exists');
  }

  const profileData = {
    drivingLicense: data.drivingLicense || null,
    licenseExpiryDate: data.licenseExpiryDate ? new Date(data.licenseExpiryDate) : null,
  };

  const created = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      isVerified: false,
      role: 'driver',
      driverProfile: { create: profileData },
    },
  });

  return exports.getDriverDetails(created.id);
};

exports.updateDriver = async (driverId, updateData) => {
  const driver = await findDriver(driverId);
  if (!driver) throw new Error('Driver not found');

  if (updateData.email && updateData.email !== driver.email) {
    const existing = await prisma.user.findUnique({ where: { email: updateData.email } });
    if (existing) throw new Error('Email already exists');
  }
  if (updateData.phone && updateData.phone !== driver.phone) {
    const existing = await prisma.user.findUnique({ where: { phone: updateData.phone } });
    if (existing) throw new Error('Phone number already exists');
  }

  const { userData, profileData } = splitDriverUpdateData(updateData);

  await prisma.user.update({
    where: { id: driverId },
    data: {
      ...userData,
      ...(Object.keys(profileData).length
        ? {
            driverProfile: {
              upsert: {
                create: profileData,
                update: profileData,
              },
            },
          }
        : {}),
    },
  });

  return exports.getDriverDetails(driverId);
};

exports.approveDriver = async (driverId, reason) => {
  const driver = await findDriver(driverId);
  if (!driver) throw new Error('Driver not found');
  await prisma.user.update({ where: { id: driverId }, data: { isVerified: true } });
  return { id: driverId, approved: true, reason: reason || null };
};

exports.rejectDriver = async (driverId, reason) => {
  const driver = await findDriver(driverId);
  if (!driver) throw new Error('Driver not found');
  await prisma.user.update({ where: { id: driverId }, data: { isVerified: false } });
  return { id: driverId, rejected: true, reason };
};

exports.suspendDriver = async (driverId, { action, reason, durationDays }) => {
  const driver = await findDriver(driverId);
  if (!driver) throw new Error('Driver not found');
  const isOnline = action === 'unsuspend';

  await prisma.user.update({
    where: { id: driverId },
    data: {
      driverProfile: {
        upsert: {
          create: { isOnline },
          update: { isOnline },
        },
      },
    },
  });

  return { id: driverId, isOnline };
};

exports.issueRefund = async (driverId, { amount, currency, tripId, reason }) => {
  const driver = await findDriver(driverId, { wallet: true });
  if (!driver) throw new Error('Driver not found');
  if (!driver.wallet) {
    await prisma.wallet.create({ data: { userId: driverId, balance: amount, currency } });
  } else {
    await prisma.wallet.update({ where: { id: driver.wallet.id }, data: { balance: { increment: amount } } });
  }
  return { refundId: 'REF-' + Date.now(), driverId, amount, currency, createdAt: new Date() };
};

exports.resetPassword = async (driverId, newPassword) => {
  const driver = await findDriver(driverId);
  if (!driver) throw new Error('Driver not found');
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: driverId }, data: { passwordHash: hash } });
};

exports.deleteDriver = async (driverId) => {
  const driver = await findDriver(driverId);
  if (!driver) throw new Error('Driver not found');
  await prisma.user.delete({ where: { id: driverId } });
};
