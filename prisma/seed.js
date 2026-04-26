const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const PASSWORD = 'password123';

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

async function ensureTripCouponSchema() {
  const expectedColumns = [
    ['couponId', 'ALTER TABLE `trips` ADD COLUMN `couponId` VARCHAR(191) NULL'],
    ['couponCode', 'ALTER TABLE `trips` ADD COLUMN `couponCode` VARCHAR(191) NULL'],
    ['fareBeforeDiscount', 'ALTER TABLE `trips` ADD COLUMN `fareBeforeDiscount` DECIMAL(10, 2) NULL'],
    ['discountAmount', 'ALTER TABLE `trips` ADD COLUMN `discountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00'],
  ];

  const existingColumns = await prisma.$queryRawUnsafe(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'trips'
      AND COLUMN_NAME IN ('couponId', 'couponCode', 'fareBeforeDiscount', 'discountAmount')
  `);

  const existingColumnNames = new Set(existingColumns.map((row) => row.COLUMN_NAME));

  for (const [columnName, statement] of expectedColumns) {
    if (!existingColumnNames.has(columnName)) {
      await prisma.$executeRawUnsafe(statement);
      console.log(`Added missing trips.${columnName} column for seed compatibility`);
    }
  }

  const couponIndex = await prisma.$queryRawUnsafe(
    "SHOW INDEX FROM `trips` WHERE Key_name = 'trips_couponId_idx'"
  );
  if (couponIndex.length === 0) {
    await prisma.$executeRawUnsafe('CREATE INDEX `trips_couponId_idx` ON `trips`(`couponId`)');
    console.log('Added missing trips_couponId_idx index for seed compatibility');
  }

  const couponForeignKey = await prisma.$queryRawUnsafe(`
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'trips'
      AND CONSTRAINT_NAME = 'trips_couponId_fkey'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  `);

  if (couponForeignKey.length === 0) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE \`trips\`
      ADD CONSTRAINT \`trips_couponId_fkey\`
      FOREIGN KEY (\`couponId\`) REFERENCES \`coupons\`(\`id\`)
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);
    console.log('Added missing trips_couponId_fkey foreign key for seed compatibility');
  }
}

async function cleanup() {
  const tables = await prisma.$queryRawUnsafe(`
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_TYPE = 'BASE TABLE'
      AND TABLE_NAME <> '_prisma_migrations'
  `);

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');

  try {
    for (const { TABLE_NAME } of tables) {
      await prisma.$executeRawUnsafe(`DELETE FROM \`${TABLE_NAME}\``);
    }
  } finally {
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
  }
}

async function main() {
  console.log('Seeding Tovo database...\n');

  await ensureTripCouponSchema();
  await cleanup();
  console.log('Cleaned existing data');

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const [svcComfort, svcRegular, svcMoto, svcPackage] = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Comfort',
        baseFare: 20,
        imageUrl: 'https://assets.tovo.app/services/comfort.png',
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Normal',
        baseFare: 10,
        imageUrl: 'https://assets.tovo.app/services/normal.png',
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Motorcycle',
        baseFare: 5,
        imageUrl: 'https://assets.tovo.app/services/moto.png',
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Packages',
        baseFare: 15,
        imageUrl: 'https://assets.tovo.app/services/packages.png',
        isActive: true,
      },
    }),
  ]);
  console.log('Seeded services');

  const [camry, corolla, bmw5, sonata, cb125, hiAce] = await Promise.all([
    prisma.vehicleModel.create({
      data: {
        name: 'Toyota Camry',
        brand: 'Toyota',
        description: 'Comfortable everyday sedan for city rides',
        imageUrl: 'https://assets.tovo.app/vehicles/camry.png',
        serviceId: svcRegular.id,
        isActive: true,
      },
    }),
    prisma.vehicleModel.create({
      data: {
        name: 'Toyota Corolla',
        brand: 'Toyota',
        description: 'Reliable and fuel-efficient city car',
        imageUrl: 'https://assets.tovo.app/vehicles/corolla.png',
        serviceId: svcRegular.id,
        isActive: true,
      },
    }),
    prisma.vehicleModel.create({
      data: {
        name: 'BMW 5 Series',
        brand: 'BMW',
        description: 'Premium sedan for higher-end rides',
        imageUrl: 'https://assets.tovo.app/vehicles/bmw5.png',
        serviceId: svcComfort.id,
        isActive: true,
      },
    }),
    prisma.vehicleModel.create({
      data: {
        name: 'Hyundai Sonata',
        brand: 'Hyundai',
        description: 'Mid-size sedan for regular rides',
        imageUrl: 'https://assets.tovo.app/vehicles/sonata.png',
        serviceId: svcRegular.id,
        isActive: true,
      },
    }),
    prisma.vehicleModel.create({
      data: {
        name: 'Honda CB125',
        brand: 'Honda',
        description: 'Fast two-wheel city commute option',
        imageUrl: 'https://assets.tovo.app/vehicles/cb125.png',
        serviceId: svcMoto.id,
        isActive: true,
      },
    }),
    prisma.vehicleModel.create({
      data: {
        name: 'Toyota Hi-Ace',
        brand: 'Toyota',
        description: 'Large vehicle for package delivery',
        imageUrl: 'https://assets.tovo.app/vehicles/hiace.png',
        serviceId: svcPackage.id,
        isActive: true,
      },
    }),
  ]);
  console.log('Seeded vehicle models');

  const serviceVehicleModelSeed = [
    { serviceId: svcComfort.id, vehicleModelId: bmw5.id },
    { serviceId: svcComfort.id, vehicleModelId: sonata.id },
    { serviceId: svcRegular.id, vehicleModelId: camry.id },
    { serviceId: svcRegular.id, vehicleModelId: corolla.id },
    { serviceId: svcRegular.id, vehicleModelId: sonata.id },
    { serviceId: svcMoto.id, vehicleModelId: cb125.id },
    { serviceId: svcPackage.id, vehicleModelId: hiAce.id },
    { serviceId: svcPackage.id, vehicleModelId: camry.id },
  ];

  await prisma.serviceVehicleModel.createMany({
    data: serviceVehicleModelSeed,
  });
  console.log('Seeded service vehicle models');

  const [ahmed, sara, omar, driver1, driver2, driver3] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Ahmed Hassan',
        email: 'ahmed.hassan@example.com',
        phone: '+201001234567',
        passwordHash,
        googleId: 'google-ahmed-001',
        avatarUrl: 'https://assets.tovo.app/avatars/user1.png',
        role: 'customer',
        isVerified: true,
        language: 'ar',
        notificationsEnabled: true,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Sara Mohamed',
        email: 'sara.mohamed@example.com',
        phone: '+201009876543',
        passwordHash,
        appleId: 'apple-sara-001',
        avatarUrl: 'https://assets.tovo.app/avatars/user2.png',
        role: 'customer',
        isVerified: true,
        language: 'en',
        notificationsEnabled: true,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Omar Khaled',
        email: 'omar.khaled@example.com',
        phone: '+201115557890',
        passwordHash,
        avatarUrl: null,
        role: 'customer',
        isVerified: false,
        language: 'en',
        notificationsEnabled: false,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Mostafa Ali',
        email: 'mostafa.ali@example.com',
        phone: '+201234567890',
        passwordHash,
        facebookId: 'facebook-mostafa-001',
        avatarUrl: 'https://assets.tovo.app/avatars/driver1.png',
        role: 'driver',
        isVerified: true,
        language: 'ar',
        driverProfile: {
          create: {
            drivingLicense: 'DL-2019-EG-001234',
            licenseExpiryDate: new Date('2027-06-30'),
            isOnline: true,
            rating: 4.8,
            totalTrips: 312,
            serviceId: svcRegular.id,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Karim Samir',
        email: 'karim.samir@example.com',
        phone: '+201098765432',
        passwordHash,
        avatarUrl: 'https://assets.tovo.app/avatars/driver2.png',
        role: 'driver',
        isVerified: true,
        language: 'ar',
        driverProfile: {
          create: {
            drivingLicense: 'DL-2020-EG-005678',
            licenseExpiryDate: new Date('2026-09-15'),
            isOnline: true,
            rating: 4.5,
            totalTrips: 178,
            serviceId: svcComfort.id,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        name: 'Youssef Nour',
        email: 'youssef.nour@example.com',
        phone: '+201122334455',
        passwordHash,
        avatarUrl: null,
        role: 'driver',
        isVerified: true,
        language: 'en',
        driverProfile: {
          create: {
            drivingLicense: 'DL-2021-EG-009999',
            licenseExpiryDate: new Date('2025-12-31'),
            isOnline: false,
            rating: 4.2,
            totalTrips: 89,
            serviceId: svcRegular.id,
          },
        },
      },
    }),
  ]);
  console.log('Seeded users and drivers');

  const [superAdmin, opsAdmin] = await Promise.all([
    prisma.adminUser.create({
      data: {
        name: 'Super Admin',
        email: 'admin@tovo.com',
        role: 'superadmin',
        passwordHash,
        isActive: true,
      },
    }),
    prisma.adminUser.create({
      data: {
        name: 'Operations Admin',
        email: 'ops@example.com',
        role: 'operations',
        passwordHash,
        isActive: true,
      },
    }),
  ]);
  console.log('Seeded admin users');

  await prisma.systemSetting.createMany({
    data: [
      { key: 'maintenance_mode', value: 'false' },
      { key: 'default_currency', value: 'EGP' },
      { key: 'fare_per_km', value: '5' },
      { key: 'commission_pct', value: '15' },
      { key: 'support_email', value: 'support@tovo.app' },
      { key: 'support_phone', value: '+20222345678' },
      { key: 'app_name', value: 'Tovo' },
      { key: 'app_version_android', value: '1.2.0' },
      { key: 'app_version_ios', value: '1.2.0' },
      { key: 'cancellation_window_sec', value: '60' },
      { key: 'max_search_radius_km', value: '10' },
      { key: 'min_trip_distance_km', value: '0.5' },
    ],
  });
  console.log('Seeded system settings');

  await prisma.region.createMany({
    data: [
      {
        name: 'Downtown Cairo',
        city: 'Cairo',
        lat: 30.0444,
        lng: 31.2357,
        radius: 12,
        status: true,
      },
      {
        name: 'Giza',
        city: 'Giza',
        lat: 30.0131,
        lng: 31.2089,
        radius: 15,
        status: true,
      },
      {
        name: 'Alexandria Pilot',
        city: 'Alexandria',
        lat: 31.2001,
        lng: 29.9187,
        radius: 8,
        status: false,
      },
    ],
  });
  console.log('Seeded regions');

  await prisma.tollGate.createMany({
    data: [
      {
        name: 'Cairo Ring Road Toll Gate',
        lat: 30.1163,
        lng: 31.3464,
        fee: 15,
        isActive: true,
      },
      {
        name: 'Moneeb Toll Plaza',
        lat: 29.9792,
        lng: 31.2118,
        fee: 10,
        isActive: true,
      },
      {
        name: 'October Bridge East Gate',
        lat: 30.0561,
        lng: 31.2489,
        fee: 12.5,
        isActive: true,
      },
      {
        name: 'Cairo Alexandria Desert Road Gate',
        lat: 30.1448,
        lng: 30.9725,
        fee: 20,
        isActive: true,
      },
    ],
  });
  console.log('Seeded toll gates');

  const [globalRule, comfortRule, packageRule, motoRule] = await Promise.all([
    prisma.commissionRule.create({
      data: {
        name: 'Global 15 Percent',
        type: 'percentage',
        status: true,
        config: { pct: 15 },
      },
    }),
    prisma.commissionRule.create({
      data: {
        name: 'Tiered Percentage Draft',
        type: 'tiered_percentage',
        status: false,
        config: [
          { minFare: 0, maxFare: 100, pct: 18 },
          { minFare: 100, maxFare: null, pct: 20 },
        ],
      },
    }),
    prisma.commissionRule.create({
      data: {
        name: 'Fixed Amount Draft',
        type: 'fixed_amount',
        status: false,
        config: [
          { minFare: 0, maxFare: 99.99, amount: 8 },
          { minFare: 100, maxFare: null, amount: 15 },
        ],
      },
    }),
    prisma.commissionRule.create({
      data: {
        name: 'Tiered Fixed Draft',
        type: 'tiered_fixed',
        status: false,
        config: [
          { minFare: 0, maxFare: 60, amount: 4 },
          { minFare: 60, maxFare: null, amount: 6 },
        ],
      },
    }),
  ]);
  console.log('Seeded commission rules');

  const [vehicle1, vehicle2, vehicle3] = await Promise.all([
    prisma.vehicle.create({
      data: { userId: driver1.id, vehicleModelId: camry.id, vin: '1HGCM82633A123456' },
    }),
    prisma.vehicle.create({
      data: { userId: driver2.id, vehicleModelId: bmw5.id, vin: '2T1BURHE0JC987654' },
    }),
    prisma.vehicle.create({
      data: { userId: driver3.id, vehicleModelId: corolla.id, vin: '3VWFE21C04M000001' },
    }),
  ]);
  console.log('Seeded vehicles');

  const servicesForVehicleModel = (vehicleModelId) =>
    serviceVehicleModelSeed
      .filter((item) => item.vehicleModelId === vehicleModelId)
      .map((item) => item.serviceId);

  await prisma.driverService.createMany({
    data: [
      { driverId: driver1.id, vehicleModelId: camry.id },
      { driverId: driver2.id, vehicleModelId: bmw5.id },
      { driverId: driver3.id, vehicleModelId: corolla.id },
    ].flatMap(({ driverId, vehicleModelId }) =>
      servicesForVehicleModel(vehicleModelId).map((serviceId) => ({
        driverId,
        serviceId,
      }))
    ),
    skipDuplicates: true,
  });
  console.log('Seeded driver services');

  const [walletAhmed, walletSara, walletOmar, walletDriver1, walletDriver2, walletDriver3] = await Promise.all([
    prisma.wallet.create({ data: { userId: ahmed.id, balance: 300, currency: 'EGP' } }),
    prisma.wallet.create({ data: { userId: sara.id, balance: 75.5, currency: 'EGP' } }),
    prisma.wallet.create({ data: { userId: omar.id, balance: 15, currency: 'EGP' } }),
    prisma.wallet.create({ data: { userId: driver1.id, balance: 1900, currency: 'EGP' } }),
    prisma.wallet.create({ data: { userId: driver2.id, balance: 915.75, currency: 'EGP' } }),
    prisma.wallet.create({ data: { userId: driver3.id, balance: 310, currency: 'EGP' } }),
  ]);
  console.log('Seeded wallets');

  await prisma.savedAddress.createMany({
    data: [
      {
        userId: ahmed.id,
        label: 'Home',
        address: '15 El-Tahrir Square, Downtown Cairo',
        lat: 30.0444,
        lng: 31.2357,
      },
      {
        userId: ahmed.id,
        label: 'Work',
        address: 'Smart Village, 6th of October City',
        lat: 30.071,
        lng: 30.98,
      },
      {
        userId: sara.id,
        label: 'Home',
        address: '7 Hassan Sabri St, Zamalek, Cairo',
        lat: 30.0626,
        lng: 31.2197,
      },
    ],
  });
  console.log('Seeded saved addresses');

  await prisma.promotion.createMany({
    data: [
      {
        title: '20% Off Your First Ride',
        description: 'New users get 20% off their first trip with Tovo',
        discountPct: 20,
        imageUrl: 'https://assets.tovo.app/promos/welcome.png',
        validUntil: new Date('2026-12-31'),
        isActive: true,
      },
      {
        title: 'Weekend Special',
        description: '15% off all comfort rides every Friday and Saturday',
        discountPct: 15,
        imageUrl: 'https://assets.tovo.app/promos/weekend.png',
        validUntil: new Date('2026-06-30'),
        isActive: true,
      },
      {
        title: 'Ramadan Offer',
        description: 'Special fares during Ramadan nights',
        discountPct: 25,
        imageUrl: 'https://assets.tovo.app/promos/ramadan.png',
        validUntil: new Date('2025-04-30'),
        isActive: false,
      },
    ],
  });
  console.log('Seeded promotions');

  await prisma.coupon.createMany({
    data: [
      {
        code: 'TOVO2025',
        discount_type: 'percentage',
        discount: 10,
        expiry_date: new Date('2026-12-31'),
        usage_limit: 100,
        usage_limit_per_rider: 1,
        min_amount: 0,
        max_discount: 20,
        coupon_type: 'all',
        status: 1,
        used_count: 14,
      },
      {
        code: 'WELCOME50',
        discount_type: 'percentage',
        discount: 50,
        expiry_date: new Date('2026-12-31'),
        usage_limit: 1,
        usage_limit_per_rider: 1,
        min_amount: 0,
        max_discount: 50,
        coupon_type: 'all',
        status: 1,
        used_count: 0,
      },
      {
        code: 'FLAT30',
        discount_type: 'amount',
        discount: 30,
        expiry_date: new Date('2026-09-01'),
        usage_limit: 250,
        usage_limit_per_rider: 2,
        min_amount: 100,
        max_discount: 30,
        coupon_type: 'all',
        status: 1,
        used_count: 5,
      },
    ],
  });
  console.log('Seeded coupons');
 const MOCK_ROUTES = {
  tahrirToRamses: {
    routeEncodedPolyline: 'wbxyCkvzECKAGAEAEBGBEDGFIFGHKJKJILKNMNKPMROTQXSZU`@WZSXQRONKLIJGHEJGHEHGJGJILKNMPOROTSVSXUZWZWd@[f@]h@_@',
    routeDistanceMeters: 4200,
    routeDurationSeconds: 1080,
  },
  zamalekToMaadi: {
    routeEncodedPolyline: 'gkxyCobzEFUDQFSHWJYL]N_@Pa@Rc@Ta@V_@X]Z[\\Yd@a@f@a@h@_@j@]l@Yn@Wp@Sn@Or@Kp@Ip@Gt@Et@Ct@At@?t@?r@Br@Dr@Fr@Hr@Jr@Lr@Nr@Pp@Rp@Tn@Vl@Xl@Zj@\\h@^h@`@f@b@d@b@d@d@b@f@`@h@^j@\\l@Zn@Xp@Vr@Tt@Rv@Px@Nz@L|@J~@H',
    routeDistanceMeters: 7800,
    routeDurationSeconds: 1440,
  },
  abdeenToOldCairo: {
    routeEncodedPolyline: 'obxyCanzEHVFRFPHRJTLVLTNVNTPVRXTZVZX\\Z^\\`@^b@`@d@b@f@b@h@`@j@^l@\\n@Zp@Xr@Vt@Tr@Rp@Pn@Nl@Lj@Jh@Hf@Fd@Db@B`@?^A\\C',
    routeDistanceMeters: 5100,
    routeDurationSeconds: 1320,
  },
  tahrirToAirport: {
    routeEncodedPolyline: 'wbxyCkvzEEOCMCKEMGOGOIOKQKQMSMSOUOUQWQWSYS[U[W]W_@Y_@[a@[c@]c@_@e@_@g@a@g@c@i@c@k@e@k@e@m@g@o@g@q@i@q@i@s@k@s@k@u@m@u@m@w@o@w@o@y@q@y@q@{@s@{@s@}@u@}@u@@w@@w@Bw@Dw@Fw@Hw@Jw@Lw@Nw@Pw@Rw@Tw@Vw@Xw@Zw@',
    routeDistanceMeters: 20100,
    routeDurationSeconds: 2100,
  },
  gardenCityToNasrCity: {
    routeEncodedPolyline: '}_xyCanzEKWIUGSEQCOAMAK?K?I@I@IBIBIBKDKFKHKHKJKJKLKLMLMLNLNLPLPLRLRLRLTLTLVLVLXLXLZL',
    routeDistanceMeters: 14200,
    routeDurationSeconds: 1680,
  },
  heliopollisToNewCairo: {
    routeEncodedPolyline: '_}xyCk~zEOe@Mc@Ka@I_@G]E[CYAS?S?Q@QBQDQFQHQJQJSLSNSPSRSRURUTUVUXUXWZWZW\\W^W^Y`@Y`@Yb@Yb@[d@[f@[f@]h@]h@_@j@_@l@_@l@a@n@a@n@',
    routeDistanceMeters: 12600,
    routeDurationSeconds: 1860,
  },
};
  const tripCompletedAhmed = await prisma.trip.create({
  data: {
    userId: ahmed.id,
    driverId: driver1.id,
    serviceId: svcComfort.id,
    status: 'completed',
    pickupLat: 30.0444,
    pickupLng: 31.2357,
    pickupAddress: 'Tahrir Square, Downtown Cairo',
    dropoffLat: 30.0626,
    dropoffLng: 31.2497,
    dropoffAddress: 'Ramses Square, Cairo',
    paymentType: 'cash',
    finalFare: 70.8,
    originalFare: 70.8,
    discountAmount: 0,
    commission: 10.8,
    driverEarnings: 60,
    currency: 'EGP',
    distanceKm: 4.2,
    durationMinutes: 18,
    startedAt: daysAgo(4),
    endedAt: daysAgo(4 - 0.01),
    // ── route fields ──
    routeEncodedPolyline: 'mock_w`{Iw`{I??_seK??_seK',
    routeDistanceMeters: 4200,
    routeDurationSeconds: 1080,
  },
});

const tripCompletedCash = await prisma.trip.create({
  data: {
    userId: sara.id,
    driverId: driver2.id,
    serviceId: svcRegular.id,
    status: 'completed',
    pickupLat: 30.0626,
    pickupLng: 31.2197,
    pickupAddress: 'Zamalek, Cairo',
    dropoffLat: 30.0131,
    dropoffLng: 31.2089,
    dropoffAddress: 'Maadi, Cairo',
    paymentType: 'cash',
    finalFare: 46,
    originalFare: 46,
    discountAmount: 0,
    commission: 6,
    driverEarnings: 40,
    currency: 'EGP',
    distanceKm: 7.8,
    durationMinutes: 24,
    startedAt: daysAgo(3),
    endedAt: daysAgo(3 - 0.01),
    // ── route fields ──
    routeEncodedPolyline: 'mock_w`{Iw`{I??_seK??_seK',
    routeDistanceMeters: 7800,
    routeDurationSeconds: 1440,
  },
});

  const tripMatched = await prisma.trip.create({
    data: {
      userId: omar.id,
      driverId: driver3.id,
      serviceId: svcRegular.id,
      status: 'matched',
      pickupLat: 30.055,
      pickupLng: 31.24,
      pickupAddress: 'Abdeen, Cairo',
      dropoffLat: 30.03,
      dropoffLng: 31.21,
      dropoffAddress: 'Old Cairo',
      paymentType: 'cash',
      finalFare: 55,
      originalFare: 55,
      discountAmount: 0,
      commission: 7.5,
      driverEarnings: 47.5,
      currency: 'EGP',
      distanceKm: 5.1,
      durationMinutes: 22,
      // ── route fields ──
    routeEncodedPolyline: 'mock_w`{Iw`{I??_seK??_seK',
    routeDistanceMeters: 7800,
    routeDurationSeconds: 1440,
    },
  });

  const tripOnWay = await prisma.trip.create({
    data: {
      userId: ahmed.id,
      driverId: driver2.id,
      serviceId: svcComfort.id,
      status: 'on_way',
      pickupLat: 30.0444,
      pickupLng: 31.2357,
      pickupAddress: 'Tahrir Square, Downtown Cairo',
      dropoffLat: 30.0761,
      dropoffLng: 31.2986,
      dropoffAddress: 'Cairo International Airport',
      paymentType: 'cash',
      finalFare: 132,
      originalFare: 132,
      discountAmount: 0,
      commission: 22,
      driverEarnings: 110,
      currency: 'EGP',
      distanceKm: 20.1,
      durationMinutes: 35,
      // ── route fields ──
    routeEncodedPolyline: 'mock_w`{Iw`{I??_seK??_seK',
    routeDistanceMeters: 7800,
    routeDurationSeconds: 1440,
    },
  });

  const tripInProgress = await prisma.trip.create({
    data: {
      userId: sara.id,
      driverId: driver1.id,
      serviceId: svcRegular.id,
      status: 'in_progress',
      pickupLat: 30.05,
      pickupLng: 31.24,
      pickupAddress: 'Garden City, Cairo',
      dropoffLat: 30.09,
      dropoffLng: 31.29,
      dropoffAddress: 'Nasr City, Cairo',
      paymentType: 'cash',
      finalFare: 92,
      originalFare: 92,
      discountAmount: 0,
      commission: 12,
      driverEarnings: 80,
      currency: 'EGP',
      distanceKm: 14.2,
      durationMinutes: 28,
      startedAt: daysAgo(0.1),
      // ── route fields ──
    routeEncodedPolyline: 'mock_w`{Iw`{I??_seK??_seK',
    routeDistanceMeters: 7800,
    routeDurationSeconds: 1440,
    },
  });

  const tripSearching = await prisma.trip.create({
    data: {
      userId: omar.id,
      serviceId: svcPackage.id,
      status: 'searching',
      pickupLat: 30.07,
      pickupLng: 31.31,
      pickupAddress: 'Heliopolis, Cairo',
      dropoffLat: 30.12,
      dropoffLng: 31.36,
      dropoffAddress: 'New Cairo',
      paymentType: 'cash',
      finalFare: 88,
      originalFare: 88,
      discountAmount: 0,
      commission: 8,
      driverEarnings: 80,
      currency: 'EGP',
      distanceKm: 12.6,
      durationMinutes: 31,
      // ── route fields ──
    routeEncodedPolyline: 'mock_w`{Iw`{I??_seK??_seK',
    routeDistanceMeters: 7800,
    routeDurationSeconds: 1440,
    },
  });

  const tripCancelled = await prisma.trip.create({
    data: {
      userId: sara.id,
      serviceId: svcRegular.id,
      status: 'cancelled',
      pickupLat: 30.0626,
      pickupLng: 31.2197,
      pickupAddress: 'Zamalek, Cairo',
      dropoffLat: 30.0131,
      dropoffLng: 31.2089,
      dropoffAddress: 'Maadi, Cairo',
      paymentType: 'cash',
      finalFare: null,
      originalFare: null,
      discountAmount: 0,
      commission: null,
      driverEarnings: null,
      currency: 'EGP',
      distanceKm: 7.8,
      durationMinutes: 20,
      cancelledAt: daysAgo(1),
      cancelledBy: sara.id,
      // ── route fields ──
    routeEncodedPolyline: 'mock_w`{Iw`{I??_seK??_seK',
    routeDistanceMeters: 7800,
    routeDurationSeconds: 1440,
    },
  });
  console.log('Seeded trips');

  await prisma.tripDecline.createMany({
    data: [
      { tripId: tripSearching.id, driverId: driver1.id },
      { tripId: tripSearching.id, driverId: driver3.id },
      { tripId: tripMatched.id, driverId: driver1.id },
    ],
  });
  console.log('Seeded trip declines');

  await prisma.commissionLog.createMany({
    data: [
      {
        tripId: tripCompletedAhmed.id,
        amount: 10.8,
        paymentType: 'cash',
        serviceId: svcComfort.id,
      },
      {
        tripId: tripCompletedCash.id,
        amount: 6,
        paymentType: 'cash',
        serviceId: svcRegular.id,
      },
    ],
  });
  console.log('Seeded commission logs');

  await prisma.rating.createMany({
    data: [
      {
        tripId: tripCompletedAhmed.id,
        userId: ahmed.id,
        driverId: driver1.id,
        stars: 5,
        comment: 'Very smooth ride, driver was polite and on time.',
      },
      {
        tripId: tripCompletedCash.id,
        userId: sara.id,
        driverId: driver2.id,
        stars: 4,
        comment: 'Ride was good overall and the driver was helpful.',
      },
    ],
  });
  console.log('Seeded ratings');

  await prisma.walletTransaction.createMany({
    data: [
      {
        walletId: walletDriver1.id,
        type: 'debit',
        amount: 10.8,
        reason: 'trip_commission_deduction',
        tripId: tripCompletedAhmed.id,
      },
      {
        walletId: walletDriver2.id,
        type: 'debit',
        amount: 6,
        reason: 'trip_commission_deduction',
        tripId: tripCompletedCash.id,
      },
      {
        walletId: walletAhmed.id,
        type: 'credit',
        amount: 50,
        reason: 'refund',
        tripId: tripCompletedAhmed.id,
      },
      {
        walletId: walletOmar.id,
        type: 'credit',
        amount: 15,
        reason: 'admin_welcome_credit',
        tripId: null,
      },
    ],
  });
  console.log('Seeded wallet transactions');

  await prisma.insuranceCard.createMany({
    data: [
      {
        userId: driver1.id,
        provider: 'Misr Insurance',
        policyNumber: 'MI-2024-00123',
        expiresAt: new Date('2026-03-31'),
      },
      {
        userId: driver2.id,
        provider: 'AXA Egypt',
        policyNumber: 'AXA-2024-99876',
        expiresAt: new Date('2025-12-31'),
      },
      {
        userId: driver3.id,
        provider: 'Allianz',
        policyNumber: 'ALL-2025-22001',
        expiresAt: new Date('2026-07-15'),
      },
    ],
  });
  console.log('Seeded insurance cards');

  await prisma.notification.createMany({
    data: [
      {
        userId: ahmed.id,
        title: 'Trip Completed',
        body: 'Your trip to Ramses Square has been completed. Rate your driver.',
        isRead: true,
      },
      {
        userId: ahmed.id,
        title: 'Refund Issued',
        body: 'A wallet refund for your last trip has been processed.',
        isRead: false,
      },
      {
        userId: sara.id,
        title: 'Weekend Special',
        body: 'Get 15% off all comfort rides this Friday and Saturday.',
        isRead: false,
      },
      {
        userId: driver1.id,
        title: 'New Rating',
        body: 'You received a 5-star rating from Ahmed Hassan.',
        isRead: false,
      },
    ],
  });
  console.log('Seeded notifications');

  await prisma.deviceToken.createMany({
    data: [
      {
        userId: ahmed.id,
        token: 'fcm_token_ahmed_ios_abc123',
        platform: 'ios',
      },
      {
        userId: sara.id,
        token: 'fcm_token_sara_android_xyz789',
        platform: 'android',
      },
      {
        userId: driver1.id,
        token: 'fcm_token_mostafa_android_def456',
        platform: 'android',
      },
      {
        userId: driver2.id,
        token: 'fcm_token_karim_android_ghi890',
        platform: 'android',
      },
    ],
  });
  console.log('Seeded device tokens');

  const ticketOpen = await prisma.supportTicket.create({
    data: {
      userId: ahmed.id,
      subject: 'Charged twice for the same trip',
      status: 'open',
    },
  });

  const ticketResolved = await prisma.supportTicket.create({
    data: {
      userId: sara.id,
      subject: 'Driver arrived late',
      status: 'resolved',
    },
  });

  await prisma.ticketMessage.createMany({
    data: [
      {
        ticketId: ticketOpen.id,
        senderId: ahmed.id,
        body: 'Hello, I was charged twice for my trip on Dec 1st. Please refund the duplicate.',
      },
      {
        ticketId: ticketOpen.id,
        senderId: superAdmin.id,
        body: 'We have reviewed the payment and issued a wallet refund.',
      },
      {
        ticketId: ticketResolved.id,
        senderId: sara.id,
        body: 'The driver was polite but arrived much later than the estimate.',
      },
      {
        ticketId: ticketResolved.id,
        senderId: opsAdmin.id,
        body: 'Thanks for reporting this. We have documented the incident and resolved the ticket.',
      },
    ],
  });
  console.log('Seeded support tickets and messages');

  await prisma.refreshToken.createMany({
    data: [
      {
        userId: ahmed.id,
        token: 'refresh_token_ahmed_active',
        expiresAt: daysFromNow(7),
      },
      {
        userId: driver1.id,
        token: 'refresh_token_driver1_active',
        expiresAt: daysFromNow(7),
      },
    ],
  });
  console.log('Seeded refresh tokens');

  await prisma.passwordResetToken.createMany({
    data: [
      {
        email: ahmed.email,
        code: '112233',
        expiresAt: daysFromNow(1 / 24),
        isUsed: false,
      },
      {
        email: omar.email,
        code: '445566',
        expiresAt: daysAgo(1),
        isUsed: true,
      },
    ],
  });
  console.log('Seeded password reset tokens');

  await prisma.faq.createMany({
    data: [
      {
        question: 'How do I book a ride?',
        answer: 'Open the app, enter your pickup and drop-off, choose a service, and request a trip.',
        order: 1,
        isActive: true,
      },
      {
        question: 'How is my fare calculated?',
        answer: 'Fare is driver earnings plus platform commission based on the active commission rule.',
        order: 2,
        isActive: true,
      },
      {
        question: 'What payment methods are accepted?',
        answer: 'Tovo currently supports cash payments only.',
        order: 3,
        isActive: true,
      },
      {
        question: 'How do refunds work?',
        answer: 'Approved refunds are credited to the customer wallet after review.',
        order: 4,
        isActive: true,
      },
    ],
  });
  console.log('Seeded FAQs');

  console.log('\nSeed complete.\n');
  console.log('Test credentials (passwords: password123)');
  console.log('Admin: admin@example.com');
  console.log('Customer: ahmed.hassan@example.com');
  console.log('Driver: mostafa.ali@example.com');
  console.log(`Commission rules created: ${[globalRule, comfortRule, packageRule, motoRule].length}`);
  console.log(`Vehicles created: ${[vehicle1, vehicle2, vehicle3].length}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
