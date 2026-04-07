const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  adminUser: {
    findUnique: jest.fn(),
  },
  wallet: {
    create: jest.fn(),
  },
  vehicleModel: {
    findUnique: jest.fn(),
  },
  vehicle: {
    create: jest.fn(),
  },
  driverProfile: {
    updateMany: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    deleteMany: jest.fn(),
  },
  otp: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  passwordResetToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  deviceToken: {
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(async (arg) => {
    if (typeof arg === 'function') {
      return arg({
        user: { create: prismaMock.user.create },
        vehicle: { create: prismaMock.vehicle.create },
        wallet: { create: prismaMock.wallet.create },
      });
    }
    return Promise.resolve([]);
  }),
};

module.exports = prismaMock;
