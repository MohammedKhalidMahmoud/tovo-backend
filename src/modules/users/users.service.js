const bcrypt = require('bcrypt');
const repo   = require('./users.repository');

// ════════════════════════════════════════════════════════════════════════════
// USER-FACING METHODS
// ════════════════════════════════════════════════════════════════════════════

const getProfile = async (userId) => {
  const user = await repo.findById(userId);
  if (!user) throw { status: 404, message: 'User not found' };
  const { passwordHash, ...safe } = user;
  return safe;
};

const updateProfile = async (userId, data) => {
  const updated = await repo.updateUser(userId, data);
  const { passwordHash, ...safe } = updated;
  return safe;
};

const updateAvatar = async (userId, avatarUrl) => {
  const existing = await repo.findById(userId);
  await repo.updateUser(userId, { avatarUrl });
  return existing?.avatarUrl ?? null;
};

const getWallet = async (userId) => {
  const wallet = await repo.getWallet(userId);
  if (!wallet) throw { status: 404, message: 'Wallet not found' };
  return wallet;
};

// ── Addresses ─────────────────────────────────────────────────────────────────

const getSavedAddresses = (userId) => repo.getSavedAddresses(userId);

const addAddress = (userId, data) => repo.createAddress({ userId, ...data });

const updateAddress = (id, userId, data) => repo.updateAddress(id, userId, data);

const deleteAddress = (id, userId) => repo.deleteAddress(id, userId);

// ── Payment Methods ───────────────────────────────────────────────────────────

const getPaymentMethods = (userId) => repo.getPaymentMethods(userId);

const addPaymentMethod = (userId, data) => repo.createPaymentMethod({ userId, ...data });

const deletePaymentMethod = (id, userId) => repo.deletePaymentMethod(id, userId);

const setDefaultPayment = (id, userId) => repo.setDefaultPayment(id, userId);

// ════════════════════════════════════════════════════════════════════════════
// ADMIN METHODS
// ════════════════════════════════════════════════════════════════════════════

/**
 * List all users with filtering, sorting, and pagination.
 */
const listUsers = async (filters) => {
  const { page, limit, sortBy, sortOrder, search, status, dateFrom, dateTo } = filters;

  const where = {};

  if (status === 'active')      where.isActive   = true;
  else if (status === 'suspended')  where.isActive   = false;
  else if (status === 'verified')   where.isVerified = true;
  else if (status === 'unverified') where.isVerified = false;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo)   where.createdAt.lte = new Date(dateTo);
  }

  if (search) {
    where.OR = [
      { name:  { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const total = await repo.countUsers(where);

  const users = await repo.findManyUsers({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip:    (page - 1) * limit,
    take:    limit,
  });

  const data = users.map((user) => ({
    id:                   user.id,
    name:                 user.name,
    email:                user.email,
    phone:                user.phone,
    isVerified:           user.isVerified,
    isActive:             user.isActive !== false,
    language:             user.language,
    avatarUrl:            user.avatarUrl,
    notificationsEnabled: user.notificationsEnabled,
    createdAt:            user.createdAt,
    updatedAt:            user.updatedAt,
    walletBalance:        user.wallet?.balance || 0,
    totalTrips:           user.tripsAsUser.length,
    avgRating:
      user.ratings.length > 0
        ? (user.ratings.reduce((sum, r) => sum + r.stars, 0) / user.ratings.length).toFixed(1)
        : 0,
  }));

  return { data, total, pages: Math.ceil(total / limit) };
};

/**
 * Get full details for a single user.
 */
const getUserDetails = async (userId) => {
  const user = await repo.findUserWithDetails(userId);
  if (!user) return null;

  const completedTrips = user.tripsAsUser.filter((t) => t.status === 'completed').length;
  const cancelledTrips = user.tripsAsUser.filter((t) => t.status === 'cancelled').length;
  const totalSpent     = user.tripsAsUser.reduce((sum, t) => sum + (t.fare ? parseFloat(t.fare) : 0), 0);

  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  user.ratings.forEach((r) => { ratingDistribution[r.stars]++; });

  return {
    id:                   user.id,
    name:                 user.name,
    email:                user.email,
    phone:                user.phone,
    isVerified:           user.isVerified,
    isActive:             user.isActive !== false,
    language:             user.language,
    avatarUrl:            user.avatarUrl,
    notificationsEnabled: user.notificationsEnabled,
    createdAt:            user.createdAt,
    updatedAt:            user.updatedAt,
    wallet: {
      balance:  user.wallet?.balance  || 0,
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
          ? (user.ratings.reduce((sum, r) => sum + r.stars, 0) / user.ratings.length).toFixed(1)
          : 0,
      totalRatings:  user.ratings.length,
      distribution:  ratingDistribution,
    },
    savedAddresses: user.savedAddresses,
    paymentMethods: user.paymentMethods.map((pm) => ({
      id:        pm.id,
      brand:     pm.brand,
      lastFour:  pm.lastFour,
      isDefault: pm.isDefault,
    })),
    deviceTokens: user.deviceTokens.map((dt) => ({
      id:        dt.id,
      platform:  dt.platform,
      createdAt: dt.createdAt,
    })),
    supportTickets: {
      total:    user.supportTickets.length,
      open:     user.supportTickets.filter((t) => t.status === 'open').length,
      resolved: user.supportTickets.filter((t) => t.status === 'resolved').length,
    },
  };
};

/**
 * Update a user's profile fields (admin).
 * Checks for duplicate email/phone before applying changes.
 */
const adminUpdateUser = async (userId, updateData) => {
  const user = await repo.findById(userId);
  if (!user) throw new Error('User not found');

  if (updateData.email && updateData.email !== user.email) {
    const existing = await repo.findByEmail(updateData.email);
    if (existing) throw new Error('Email already exists');
  }

  if (updateData.phone && updateData.phone !== user.phone) {
    const existing = await repo.findByPhone(updateData.phone);
    if (existing) throw new Error('Phone number already exists');
  }

  await repo.updateUser(userId, updateData);
  return getUserDetails(userId);
};

/**
 * Suspend or unsuspend a user account.
 * Persists isActive, suspensionReason, and suspensionUntil to the database.
 */
const suspendUser = async (userId, { action, reason, durationDays }) => {
  const user = await repo.findById(userId);
  if (!user) throw new Error('User not found');

  const isActive       = action !== 'suspend';
  const suspensionUntil =
    action === 'suspend' && durationDays
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;

  await repo.updateUser(userId, {
    isActive,
    suspensionReason: action === 'suspend' ? (reason || null) : null,
    suspensionUntil,
  });

  return { id: userId, isActive, suspensionReason: reason || null, suspensionUntil };
};

/**
 * Credit a user's wallet as a refund.
 * Creates the wallet if it does not yet exist.
 */
const issueRefund = async (userId, refundData) => {
  const user = await repo.findById(userId);
  if (!user) throw new Error('User not found');

  let wallet = await repo.getWallet(userId);

  if (!wallet) {
    wallet = await repo.createWallet({
      userId,
      currency: refundData.currency,
      balance:  refundData.amount,
    });
  } else {
    wallet = await repo.incrementWalletBalance(wallet.id, refundData.amount);
  }

  // TODO: persist a Refund record for audit trail
  // TODO: send push notification to user

  return {
    refundId:  `REF-${Date.now()}`,
    userId,
    amount:    refundData.amount,
    currency:  refundData.currency,
    status:    'pending',
    tripId:    refundData.tripId || null,
    reason:    refundData.reason,
    notes:     refundData.notes || null,
    createdAt: new Date(),
  };
};

/**
 * Reset a user's password (admin).
 */
const resetPassword = async (userId, newPassword) => {
  const user = await repo.findById(userId);
  if (!user) throw new Error('User not found');

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await repo.updateUser(userId, { passwordHash });

  // TODO: send notification to user about password reset
};

/**
 * Permanently delete a user account.
 * The reason is accepted for audit logging purposes.
 */
const adminDeleteUser = async (userId, reason) => {
  const user = await repo.findById(userId);
  if (!user) throw new Error('User not found');

  // TODO: log deletion activity with `reason` for audit
  await repo.deleteUser(userId);
};

/**
 * Create a new user (admin).
 */
const adminCreateUser = async (data) => {
  const existingEmail = await repo.findByEmail(data.email);
  if (existingEmail) throw new Error('Email already exists');

  if (data.phone) {
    const existingPhone = await repo.findByPhone(data.phone);
    if (existingPhone) throw new Error('Phone number already exists');
  }

  const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;

  const user = await repo.createUser({
    name:        data.name,
    email:       data.email,
    phone:       data.phone || null,
    passwordHash,
    language:    data.language || 'en',
    isVerified:  data.isVerified || false,
  });

  return getUserDetails(user.id);
};

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  // user-facing
  getProfile,
  updateProfile,
  updateAvatar,
  getWallet,
  getSavedAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPayment,
  // admin
  listUsers,
  getUserDetails,
  adminUpdateUser,
  suspendUser,
  issueRefund,
  resetPassword,
  adminDeleteUser,
  adminCreateUser,
};