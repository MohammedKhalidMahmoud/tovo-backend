const prisma = require('../../config/prisma');

const DRIVER_INCLUDE = {
  vehicle: { include: { vehicleModel: true } },
  wallet: true,
  driverProfile: true,
};

const DRIVER_PROFILE_FIELDS = new Set([
  'drivingLicense',
  'licenseExpiryDate',
  'isOnline',
  'rating',
  'totalTrips',
  'serviceId',
]);

const splitCaptainUpdateData = (data = {}) => {
  const userData = {};
  const profileData = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined) return;
    if (DRIVER_PROFILE_FIELDS.has(key)) profileData[key] = value;
    else userData[key] = value;
  });

  return { userData, profileData };
};

const findById = (id) =>
  prisma.user.findFirst({
    where: { id, role: 'driver' },
    include: DRIVER_INCLUDE,
  });

const updateCaptain = (id, data) => {
  const { userData, profileData } = splitCaptainUpdateData(data);

  return prisma.user.update({
    where: { id },
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
    include: DRIVER_INCLUDE,
  });
};

const getWallet = (userId) =>
  prisma.wallet.findUnique({ where: { userId } });

const getInsuranceCards = (userId) =>
  prisma.insuranceCard.findMany({ where: { userId } });

module.exports = {
  findById, updateCaptain, getWallet,
  getInsuranceCards,
};
