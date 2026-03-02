// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Tovo database...\n');

  // ─────────────────────────────────────────────
  //  CLEANUP (order matters — children before parents)
  // ─────────────────────────────────────────────
  await prisma.fareOffer.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.service.deleteMany();
  await prisma.ticketMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.savedAddress.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.insuranceCard.deleteMany();
  // await prisma.captainPricePlan.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.pricePlan.deleteMany();
  await prisma.vehicleType.deleteMany();
  await prisma.captain.deleteMany();
  await prisma.user.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.systemSetting.deleteMany();
  console.log('✅ Cleaned existing data\n');

  // ─────────────────────────────────────────────
  //  SERVICES
  // ─────────────────────────────────────────────
  const [svcComfort, svcRegular, svcMoto, svcPackage] = await Promise.all([
    prisma.service.create({ data: { name: 'Comfort',                baseFare: 20.00, isActive: true } }),
    prisma.service.create({ data: { name: 'Regular',                baseFare: 10.00, isActive: true } }),
    prisma.service.create({ data: { name: 'Motorcycle',             baseFare: 5.00,  isActive: true } }),
    prisma.service.create({ data: { name: 'Package Transportation', baseFare: 15.00, isActive: true } }),
  ]);
  console.log('✅ Services created');

  // ─────────────────────────────────────────────
  //  VEHICLE TYPES
  // ─────────────────────────────────────────────
  const [regularCar, vipCar] = await Promise.all([
    prisma.vehicleType.create({
      data: {
        name:        'Regular Car',
        description: 'Comfortable everyday rides at affordable prices',
        imageUrl:    'https://assets.tovo.app/vehicles/regular.png',
      },
    }),
    prisma.vehicleType.create({
      data: {
        name:        'VIP Car',
        description: 'Premium vehicles with top-rated captains',
        imageUrl:    'https://assets.tovo.app/vehicles/vip.png',
      },
    }),
  ]);
  console.log('✅ Vehicle types created');

  // ─────────────────────────────────────────────
  //  PRICE PLANS
  // ─────────────────────────────────────────────
  const [basicPlan, starterPlan, proPlan] = await Promise.all([
    prisma.pricePlan.create({
      data: {
        name:     'basic',
        price:    0.00,
        credits:  10,
        features: ['Up to 10 trips/week', 'Standard support', 'Basic analytics'],
      },
    }),
    prisma.pricePlan.create({
      data: {
        name:     'starter',
        price:    49.99,
        credits:  50,
        features: ['Up to 50 trips/week', 'Priority support', 'Trip analytics', 'Early access features'],
      },
    }),
    prisma.pricePlan.create({
      data: {
        name:     'pro',
        price:    99.99,
        credits:  -1, // unlimited
        features: ['Unlimited trips', '24/7 dedicated support', 'Advanced analytics', 'VIP badge', 'Featured in app'],
      },
    }),
  ]);
  console.log('✅ Price plans created');

  // ─────────────────────────────────────────────
  //  USERS
  // ─────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  const [ahmed, sara, omar] = await Promise.all([
    prisma.user.create({
      data: {
        name:         'Ahmed Hassan',
        email:        'ahmed.hassan@example.com',
        phone:        '+201001234567',
        passwordHash,
        avatarUrl:    'https://assets.tovo.app/avatars/user1.png',
        role:         'user',
        isVerified:   true,
        language:     'ar',
      },
    }),
    prisma.user.create({
      data: {
        name:         'Sara Mohamed',
        email:        'sara.mohamed@example.com',
        phone:        '+201009876543',
        passwordHash,
        avatarUrl:    'https://assets.tovo.app/avatars/user2.png',
        role:         'user',
        isVerified:   true,
        language:     'en',
      },
    }),
    prisma.user.create({
      data: {
        name:         'Omar Khaled',
        email:        'omar.khaled@example.com',
        phone:        '+201115557890',
        passwordHash,
        avatarUrl:    null,
        role:         'user',
        isVerified:   false,
        language:     'en',
      },
    }),
  ]);
  console.log('✅ Users created');

  // ─────────────────────────────────────────────
  //  CAPTAINS
  // ─────────────────────────────────────────────
  const [kaptan1, kaptan2, kaptan3] = await Promise.all([
    prisma.captain.create({
      data: {
        name:           'Mostafa Ali',
        email:          'mostafa.ali@example.com',
        phone:          '+201234567890',
        passwordHash,
        avatarUrl:      'https://assets.tovo.app/avatars/captain1.png',
        drivingLicense:    'DL-2019-EG-001234',
        licenseExpiryDate: new Date('2027-06-30'),
        isVerified:        true,
        isOnline:          true,
        rating:            4.8,
        totalTrips:        312,
        language:          'ar',
      },
    }),
    prisma.captain.create({
      data: {
        name:           'Karim Samir',
        email:          'karim.samir@example.com',
        phone:          '+201098765432',
        passwordHash,
        avatarUrl:      'https://assets.tovo.app/avatars/captain2.png',
        drivingLicense:    'DL-2020-EG-005678',
        licenseExpiryDate: new Date('2026-09-15'),
        isVerified:        true,
        isOnline:          true,
        rating:            4.5,
        totalTrips:        178,
        // currentLat:     30.0580,  // near Garden City, Cairo
        // currentLng:     31.2280,
        // heading:        180.0,
        language:       'ar',
      },
    }),
    prisma.captain.create({
      data: {
        name:           'Youssef Nour',
        email:          'youssef.nour@example.com',
        phone:          '+201122334455',
        passwordHash,
        avatarUrl:      null,
        drivingLicense:    'DL-2021-EG-009999',
        licenseExpiryDate: new Date('2025-12-31'),  // expired — useful for testing
        isVerified:        true,
        isOnline:          false,  // offline captain
        rating:            4.2,
        totalTrips:        89,
        // currentLat:     null,
        // currentLng:     null,
        // heading:        null,
        language:       'en',
      },
    }),
  ]);
  console.log('✅ Captains created');

  // ─────────────────────────────────────────────
  //  ADMIN ACCOUNT
  // create a default administrator so the panel can be accessed
  await prisma.adminUser.create({
    data: {
      name: 'Super Admin',
      email: 'admin@example.com',
      role: 'superadmin', // could be 'admin'/'superadmin'
      passwordHash,
    },
  });
  console.log('✅ Admin user created (admin@example.com / password123)');

  // ─────────────────────────────────────────────
  //  SYSTEM SETTINGS
  // insert some default system configuration values
  await prisma.systemSetting.createMany({
    data: [
      { key: 'maintenance_mode', value: JSON.stringify(false), description: 'Toggle system-wide maintenance mode' },
      { key: 'default_currency', value: JSON.stringify('EGP'), description: 'Currency used throughout the platform' },
      { key: 'support_email', value: JSON.stringify('support@tovo.app'), description: 'Email address for user support' },
    ],
  });
  console.log('✅ System settings seeded');

  // ─────────────────────────────────────────────
  //  VEHICLES
  // ─────────────────────────────────────────────
  await Promise.all([
    prisma.vehicle.create({
      data: {
        captainId: kaptan1.id,
        typeId:    regularCar.id,
        vin:       '1HGCM82633A123456',
      },
    }),
    prisma.vehicle.create({
      data: {
        captainId: kaptan2.id,
        typeId:    vipCar.id,
        vin:       '2T1BURHE0JC987654',
      },
    }),
    prisma.vehicle.create({
      data: {
        captainId: kaptan3.id,
        typeId:    regularCar.id,
        vin:       '3VWFE21C04M000001',
      },
    }),
  ]);
  console.log('✅ Vehicles created');

  // ─────────────────────────────────────────────
  //  WALLETS
  // ─────────────────────────────────────────────
  await Promise.all([
    // User wallets
    prisma.wallet.create({ data: { userId: ahmed.id, balance: 250.00, currency: 'EGP' } }),
    prisma.wallet.create({ data: { userId: sara.id,  balance: 75.50,  currency: 'EGP' } }),
    prisma.wallet.create({ data: { userId: omar.id,  balance: 0.00,   currency: 'EGP' } }),
    // Captain wallets
    prisma.wallet.create({ data: { captainId: kaptan1.id, balance: 1840.00, currency: 'EGP' } }),
    prisma.wallet.create({ data: { captainId: kaptan2.id, balance: 920.75,  currency: 'EGP' } }),
    prisma.wallet.create({ data: { captainId: kaptan3.id, balance: 310.00,  currency: 'EGP' } }),
  ]);
  console.log('✅ Wallets created');

  // ─────────────────────────────────────────────
  //  CAPTAIN PRICE PLANS
  // ─────────────────────────────────────────────
  // await Promise.all([
  //   prisma.captainPricePlan.create({
  //     data: {
  //       captainId: kaptan1.id,
  //       planId:    proPlan.id,
  //       isActive:  true,
  //       startedAt: new Date('2025-01-01'),
  //       expiresAt: new Date('2026-01-01'),
  //     },
  //   }),
  //   prisma.captainPricePlan.create({
  //     data: {
  //       captainId: kaptan2.id,
  //       planId:    starterPlan.id,
  //       isActive:  true,
  //       startedAt: new Date('2025-06-01'),
  //       expiresAt: new Date('2026-06-01'),
  //     },
  //   }),
  //   prisma.captainPricePlan.create({
  //     data: {
  //       captainId: kaptan3.id,
  //       planId:    basicPlan.id,
  //       isActive:  true,
  //       startedAt: new Date('2025-10-01'),
  //       expiresAt: null,
  //     },
  //   }),
  // ]);
  // console.log('✅ Captain price plans created');

  // ─────────────────────────────────────────────
  //  PAYMENT METHODS
  // ─────────────────────────────────────────────
  const [ahmedCard1, ahmedCard2, saraCard] = await Promise.all([
    prisma.paymentMethod.create({
      data: {
        userId:       ahmed.id,
        brand:        'visa',
        lastFour:     '4242',
        maskedNumber: '4242 **** **** 4242',
        expiry:       '12/27',
        isDefault:    true,
      },
    }),
    prisma.paymentMethod.create({
      data: {
        userId:       ahmed.id,
        brand:        'mastercard',
        lastFour:     '8888',
        maskedNumber: '5555 **** **** 8888',
        expiry:       '08/26',
        isDefault:    false,
      },
    }),
    prisma.paymentMethod.create({
      data: {
        userId:       sara.id,
        brand:        'apple_pay',
        lastFour:     null,
        maskedNumber: null,
        expiry:       null,
        isDefault:    true,
      },
    }),
  ]);
  console.log('✅ Payment methods created');

  // ─────────────────────────────────────────────
  //  SAVED ADDRESSES
  // ─────────────────────────────────────────────
  await Promise.all([
    prisma.savedAddress.create({
      data: {
        userId:  ahmed.id,
        label:   'Home',
        address: '15 El-Tahrir Square, Downtown Cairo',
        lat:     30.0444,
        lng:     31.2357,
      },
    }),
    prisma.savedAddress.create({
      data: {
        userId:  ahmed.id,
        label:   'Work',
        address: 'Smart Village, 6th of October City',
        lat:     30.0710,
        lng:     30.9800,
      },
    }),
    prisma.savedAddress.create({
      data: {
        userId:  sara.id,
        label:   'Home',
        address: '7 Hassan Sabri St, Zamalek, Cairo',
        lat:     30.0626,
        lng:     31.2197,
      },
    }),
  ]);
  console.log('✅ Saved addresses created');

  // ─────────────────────────────────────────────
  //  WISHLIST ITEMS
  // ─────────────────────────────────────────────
  await Promise.all([
    prisma.wishlistItem.create({ data: { userId: ahmed.id, itemRef: vipCar.id } }),
    prisma.wishlistItem.create({ data: { userId: sara.id,  itemRef: regularCar.id } }),
  ]);
  console.log('✅ Wishlist items created');

  // ─────────────────────────────────────────────
  //  PROMOTIONS
  // ─────────────────────────────────────────────
  await Promise.all([
    prisma.promotion.create({
      data: {
        title:       '20% Off Your First Ride',
        description: 'New users get 20% off their first trip with Tovo',
        discountPct: 20,
        imageUrl:    'https://assets.tovo.app/promos/welcome.png',
        validUntil:  new Date('2026-12-31'),
        isActive:    true,
      },
    }),
    prisma.promotion.create({
      data: {
        title:       'Weekend Special',
        description: '15% off all VIP rides every Friday and Saturday',
        discountPct: 15,
        imageUrl:    'https://assets.tovo.app/promos/weekend.png',
        validUntil:  new Date('2026-06-30'),
        isActive:    true,
      },
    }),
    prisma.promotion.create({
      data: {
        title:       'Ramadan Offer',
        description: 'Special fares during Ramadan nights',
        discountPct: 25,
        imageUrl:    'https://assets.tovo.app/promos/ramadan.png',
        validUntil:  new Date('2025-04-30'),
        isActive:    false, // expired
      },
    }),
  ]);
  console.log('✅ Promotions created');

  // ─────────────────────────────────────────────
  //  COUPONS (seed data adapted to new schema)
  // ─────────────────────────────────────────────
  await Promise.all([
    prisma.coupon.create({
      data: {
        code:                  'TOVO2025',
        discount_type:         'percentage',
        discount:              10.00,
        expiry_date:           new Date('2026-01-01'),
        usage_limit:           100,
        usage_limit_per_rider: 1,
        min_amount:            0,
        max_discount:          20.00,
        coupon_type:           'all',
        status:                1,
        used_count:            14,
      },
    }),
    prisma.coupon.create({
      data: {
        code:                  'WELCOME50',
        discount_type:         'percentage',
        discount:              50.00,
        expiry_date:           new Date('2026-12-31'),
        usage_limit:           1,
        usage_limit_per_rider: 1,
        min_amount:            0,
        max_discount:          50.00,
        coupon_type:           'all',
        status:                1,
        used_count:            0,
      },
    }),
    prisma.coupon.create({
      data: {
        code:                  'EXPIRED10',
        discount_type:         'percentage',
        discount:              10.00,
        expiry_date:           new Date('2024-01-01'),
        usage_limit:           50,
        usage_limit_per_rider: 1,
        min_amount:            0,
        max_discount:          10.00,
        coupon_type:           'all',
        status:                0,
        used_count:            50,
      },
    }),
  ]);
  console.log('✅ Coupons created');

  // ─────────────────────────────────────────────
  //  TRIPS
  // ─────────────────────────────────────────────
const completedTrip = await prisma.trip.create({
  data: {
    user: { connect: { id: ahmed.id } },
    captain: { connect: { id: kaptan1.id } },
    plan: { connect: { id: basicPlan.id } }, // REQUIRED
    service: { connect: { id: svcComfort.id } },
    paymentMethod: { connect: { id: ahmedCard1.id } },

    status: 'completed',
    pickupLat: 30.0444,
    pickupLng: 31.2357,
    pickupAddress: 'Tahrir Square, Downtown Cairo',
    dropoffLat: 30.0626,
    dropoffLng: 31.2497,
    dropoffAddress: 'Ramses Square, Cairo',
    fare: 45.00,
    currency: 'EGP',
    distanceKm: 4.2,
    durationMinutes: 18,
    startedAt: new Date('2025-12-01T10:00:00Z'),
    endedAt: new Date('2025-12-01T10:18:00Z'),
  }
});

// ─────────────────────────────────────────────
//  TRIPS
// ─────────────────────────────────────────────

const cancelledTrip = await prisma.trip.create({
  data: {
    user: { connect: { id: sara.id } },
    plan: { connect: { id: starterPlan.id } }, // starter
    service: { connect: { id: svcRegular.id } },
    paymentMethod: { connect: { id: saraCard.id } },

    status: 'cancelled',
    pickupLat: 30.0626,
    pickupLng: 31.2197,
    pickupAddress: 'Zamalek, Cairo',
    dropoffLat: 30.0131,
    dropoffLng: 31.2089,
    dropoffAddress: 'Maadi, Cairo',
    fare: null,
    currency: 'EGP',
    distanceKm: 7.8,
    durationMinutes: null,
    cancelledAt: new Date('2025-12-05T14:30:00Z'),
    cancelledBy: sara.id,
  },
});

const activeTrip = await prisma.trip.create({
  data: {
    user: { connect: { id: ahmed.id } },
    captain: { connect: { id: kaptan2.id } },
    plan: { connect: { id: proPlan.id } }, // pro
    service: { connect: { id: svcComfort.id } },
    paymentMethod: { connect: { id: ahmedCard2.id } },

    status: 'on_way',
    pickupLat: 30.0444,
    pickupLng: 31.2357,
    pickupAddress: 'Tahrir Square, Downtown Cairo',
    dropoffLat: 30.0761,
    dropoffLng: 31.2986,
    dropoffAddress: 'Cairo International Airport',
    fare: 120.0,
    currency: 'EGP',
    distanceKm: 20.1,
    durationMinutes: 35,
  },
});

const searchingTrip = await prisma.trip.create({
  data: {
    user: { connect: { id: omar.id } },
    plan: { connect: { id: basicPlan.id } }, // basic
    service: { connect: { id: svcRegular.id } },

    status: 'searching',
    pickupLat: 30.0550,
    pickupLng: 31.2400,
    pickupAddress: 'Abdeen, Cairo',
    dropoffLat: 30.0300,
    dropoffLng: 31.2100,
    dropoffAddress: 'Old Cairo',
    fare: 55.0,
    currency: 'EGP',
    distanceKm: 5.1,
    durationMinutes: 22,
  },
});

console.log('✅ Trips created');

  // ─────────────────────────────────────────────
  //  FARE OFFERS
  // ─────────────────────────────────────────────
  await prisma.fareOffer.create({
    data: {
      tripId:       searchingTrip.id,
      captainId:    kaptan1.id,
      proposedFare: 50.00,
      currency:     'EGP',
      isAccepted:   false,
    },
  });
  console.log('✅ Fare offers created');

  // ─────────────────────────────────────────────
  //  RATINGS
  // ─────────────────────────────────────────────
  await prisma.rating.create({
    data: {
      tripId:    completedTrip.id,
      userId:    ahmed.id,
      captainId: kaptan1.id,
      stars:     5,
      comment:   'Very smooth ride, captain was polite and on time!',
    },
  });
  console.log('✅ Ratings created');

  // ─────────────────────────────────────────────
  //  INSURANCE CARDS
  // ─────────────────────────────────────────────
  await Promise.all([
    prisma.insuranceCard.create({
      data: {
        captainId:    kaptan1.id,
        provider:     'Misr Insurance',
        policyNumber: 'MI-2024-00123',
        expiresAt:    new Date('2026-03-31'),
      },
    }),
    prisma.insuranceCard.create({
      data: {
        captainId:    kaptan2.id,
        provider:     'AXA Egypt',
        policyNumber: 'AXA-2024-99876',
        expiresAt:    new Date('2025-12-31'),
      },
    }),
  ]);
  console.log('✅ Insurance cards created');

  // ─────────────────────────────────────────────
  //  NOTIFICATIONS
  // ─────────────────────────────────────────────
  await Promise.all([
    prisma.notification.create({
      data: {
        userId:  ahmed.id,
        title:   'Trip Completed',
        body:    'Your trip to Ramses Square has been completed. Rate your captain!',
        isRead:  true,
      },
    }),
    prisma.notification.create({
      data: {
        userId:  ahmed.id,
        title:   'Weekend Special 🎉',
        body:    'Get 15% off all VIP rides this Friday and Saturday.',
        isRead:  false,
      },
    }),
    prisma.notification.create({
      data: {
        userId:  sara.id,
        title:   'Trip Cancelled',
        body:    'Your trip has been cancelled. No charges were made.',
        isRead:  false,
      },
    }),
  ]);
  console.log('✅ Notifications created');

  // ─────────────────────────────────────────────
  //  DEVICE TOKENS
  // ─────────────────────────────────────────────
  await Promise.all([
    prisma.deviceToken.create({
      data: { userId: ahmed.id, token: 'fcm_token_ahmed_iphone_abc123', platform: 'ios' },
    }),
    prisma.deviceToken.create({
      data: { userId: sara.id, token: 'fcm_token_sara_android_xyz789', platform: 'android' },
    }),
    prisma.deviceToken.create({
      data: { captainId: kaptan1.id, token: 'fcm_token_mostafa_android_def456', platform: 'android' },
    }),
  ]);
  console.log('✅ Device tokens created');

  // ─────────────────────────────────────────────
  //  SUPPORT TICKETS
  // ─────────────────────────────────────────────
  const ticket = await prisma.supportTicket.create({
    data: {
      userId:   ahmed.id,
      subject:  'Charged twice for the same trip',
      status:   'open',
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      senderId: ahmed.id,
      body:     'Hello, I was charged twice for my trip on Dec 1st. Transaction IDs: TXN001 and TXN002. Please refund the duplicate.',
    },
  });
  console.log('✅ Support tickets created');

  // ─────────────────────────────────────────────
  //  OTPs (for testing OTP flow)
  // ─────────────────────────────────────────────
  await Promise.all([
    prisma.otp.create({
      data: {
        userId:    ahmed.id,
        phone:     '+201001234567',
        code:      '123456',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        isUsed:    false,
      },
    }),
    prisma.otp.create({
      data: {
        captainId: kaptan3.id,
        phone:     '+201122334455',
        code:      '654321',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        isUsed:    false,
      },
    }),
  ]);
  console.log('✅ OTPs created');

  console.log('\n🎉 Seeding complete!\n');
  console.log('──────────────────────────────────────────');
  console.log('Test credentials (all passwords: Password123!)');
  console.log('──────────────────────────────────────────');
  console.log('Users:');
  console.log('  ahmed.hassan@example.com   (verified, has wallet + cards)');
  console.log('  sara.mohamed@example.com   (verified, Apple Pay)');
  console.log('  omar.khaled@example.com    (unverified, no payment method)');
  console.log('Captains:');
  console.log('  mostafa.ali@example.com    (online, Regular Car, Pro plan)');
  console.log('  karim.samir@example.com    (online, VIP Car, Starter plan)');
  console.log('  youssef.nour@example.com   (offline, Regular Car, Basic plan)');
  console.log('──────────────────────────────────────────');
  console.log('OTP codes for testing:');
  console.log('  +201001234567  →  123456');
  console.log('  +201122334455  →  654321');
  console.log('──────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });