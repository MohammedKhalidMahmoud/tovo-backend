// ════════════════════════════════════════════════════════════════════════════════
// Users - Admin Service
// Path: src/modules/admin/users/users.service.js
// ════════════════════════════════════════════════════════════════════════════════

const prisma = require('../../../config/prisma');
const bcrypt = require('bcryptjs');

/**
 * List all users with filters, search, and pagination
 */
exports.listUsers = async (filters) => {
  const { page, limit, sortBy, sortOrder, search, status, dateFrom, dateTo } =
    filters;

  // Build where clause
  const where = {};

  // Status filter
  if (status === 'active') {
    where.isActive = { not: false };
  } else if (status === 'suspended') {
    where.isActive = false;
  } else if (status === 'verified') {
    where.isVerified = true;
  } else if (status === 'unverified') {
    where.isVerified = false;
  }

  // Date range filter
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  // Search in name, email, phone
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get total count
  const total = await prisma.user.count({ where });

  // Get paginated results
  const users = await prisma.user.findMany({
    where,
    include: {
      wallet: true,
      tripsAsUser: {
        select: { id: true },
      },
      ratings: {
        select: { stars: true },
      },
    },
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Transform data
  const transformedUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isVerified: user.isVerified,
    isActive: !user.isActive === false,
    language: user.language,
    avatarUrl: user.avatarUrl,
    notificationsEnabled: user.notificationsEnabled,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    walletBalance: user.wallet?.balance || 0,
    totalTrips: user.tripsAsUser.length,
    avgRating:
      user.ratings.length > 0
        ? (
            user.ratings.reduce((sum, r) => sum + r.stars, 0) /
            user.ratings.length
          ).toFixed(1)
        : 0,
  }));

  return {
    data: transformedUsers,
    total,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Get detailed user information
 */
exports.getUserDetails = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallet: true,
      savedAddresses: true,
      paymentMethods: true,
      deviceTokens: true,
      tripsAsUser: {
        select: { id: true, status: true, fare: true, createdAt: true },
      },
      ratings: true,
      supportTickets: {
        select: { id: true, status: true },
      },
    },
  });

  if (!user) return null;

  // Count trips by status
  const completedTrips = user.tripsAsUser.filter(
    (t) => t.status === 'completed'
  ).length;
  const cancelledTrips = user.tripsAsUser.filter(
    (t) => t.status === 'cancelled'
  ).length;
  const totalSpent = user.tripsAsUser.reduce(
    (sum, t) => sum + (t.fare ? parseFloat(t.fare) : 0),
    0
  );

  // Calculate rating distribution
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  user.ratings.forEach((r) => {
    ratingDistribution[r.stars]++;
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isVerified: user.isVerified,
    isActive: user.isActive !== false,
    language: user.language,
    avatarUrl: user.avatarUrl,
    notificationsEnabled: user.notificationsEnabled,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    wallet: {
      balance: user.wallet?.balance || 0,
      currency: user.wallet?.currency || 'EGP',
    },
    tripsStats: {
      totalTrips: user.tripsAsUser.length,
      completedTrips,
      cancelledTrips,
      totalSpent,
    },
    ratingsStats: {
      avgRating:
        user.ratings.length > 0
          ? (
              user.ratings.reduce((sum, r) => sum + r.stars, 0) /
              user.ratings.length
            ).toFixed(1)
          : 0,
      totalRatings: user.ratings.length,
      distribution: ratingDistribution,
    },
    savedAddresses: user.savedAddresses,
    paymentMethods: user.paymentMethods.map((pm) => ({
      id: pm.id,
      brand: pm.brand,
      lastFour: pm.lastFour,
      isDefault: pm.isDefault,
    })),
    deviceTokens: user.deviceTokens.map((dt) => ({
      id: dt.id,
      platform: dt.platform,
      createdAt: dt.createdAt,
    })),
    supportTickets: {
      total: user.supportTickets.length,
      open: user.supportTickets.filter((t) => t.status === 'open').length,
      resolved: user.supportTickets.filter((t) => t.status === 'resolved').length,
    },
  };
};

/**
 * Update user information
 */
exports.updateUser = async (userId, updateData) => {
  // Check if user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  // Check for duplicate email/phone if being updated
  if (updateData.email && updateData.email !== user.email) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: updateData.email },
    });
    if (existingEmail) throw new Error('Email already exists');
  }

  if (updateData.phone && updateData.phone !== user.phone) {
    const existingPhone = await prisma.user.findUnique({
      where: { phone: updateData.phone },
    });
    if (existingPhone) throw new Error('Phone number already exists');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return exports.getUserDetails(updated.id);
};

/**
 * Suspend or unsuspend user
 */
exports.suspendUser = async (userId, data) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const isActive = data.action === 'suspend' ? false : true;
  const suspensionUntil =
    data.action === 'suspend' && data.durationDays
      ? new Date(Date.now() + data.durationDays * 24 * 60 * 60 * 1000)
      : null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive,
      // Note: Add suspension fields to User model if needed
    },
  });

  return {
    id: userId,
    isActive,
    suspensionReason: data.action === 'suspend' ? data.reason : null,
    suspensionUntil,
  };
};

/**
 * Issue refund to user wallet
 */
exports.issueRefund = async (userId, refundData) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { wallet: true },
  });

  if (!user) throw new Error('User not found');

  // Get or create wallet
  let wallet = user.wallet;
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        currency: refundData.currency,
        balance: refundData.amount,
      },
    });
  } else {
    // Update wallet balance
    wallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: refundData.amount,
        },
      },
    });
  }

  // TODO: Create refund record in a Refunds table if needed
  // TODO: Send notification to user about refund

  return {
    refundId: 'REF-' + Date.now(), // Generate unique refund ID
    userId,
    amount: refundData.amount,
    currency: refundData.currency,
    status: 'pending',
    tripId: refundData.tripId || null,
    reason: refundData.reason,
    notes: refundData.notes,
    createdAt: new Date(),
  };
};

/**
 * Reset user password
 */
exports.resetPassword = async (userId, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // TODO: Send notification to user about password reset
};

/**
 * Delete user account
 */
exports.deleteUser = async (userId, reason) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  // TODO: Implement soft delete or handle related data
  // For now, just delete related records and user

  await prisma.user.delete({
    where: { id: userId },
  });

  // TODO: Log deletion activity for audit
};

/**
 * Create a new user (admin)
 */
exports.createUser = async (data) => {
  // check duplicates
  const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingEmail) throw new Error('Email already exists');

  if (data.phone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existingPhone) throw new Error('Phone number already exists');
  }

  const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash,
      language: data.language || 'en',
      isVerified: data.isVerified || false,
    },
  });

  return exports.getUserDetails(user.id);
};
