const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mailer = require('../../config/mailer');
const repo = require('./users.repository');

const EMAIL_CHANGE_TOKEN_EXPIRY = process.env.EMAIL_CHANGE_TOKEN_EXPIRES_IN || '1h';

const createEmailChangeToken = ({ userId, currentEmail, newEmail }) =>
  jwt.sign(
    { type: 'email_change', userId, currentEmail, newEmail },
    process.env.EMAIL_CHANGE_SECRET || process.env.JWT_SECRET,
    { expiresIn: EMAIL_CHANGE_TOKEN_EXPIRY }
  );

const verifyEmailChangeToken = (token) => {
  try {
    return jwt.verify(token, process.env.EMAIL_CHANGE_SECRET || process.env.JWT_SECRET);
  } catch (err) {
    throw { status: 400, message: 'Invalid or expired email verification link' };
  }
};

// User-facing methods
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

const requestEmailChange = async (userId, { newEmail, currentPassword, baseUrl }) => {
  const user = await repo.findById(userId);
  if (!user) throw { status: 404, message: 'User not found' };
  if (!user.passwordHash) throw { status: 400, message: 'Password is not set for this account' };
  if (user.email === newEmail) throw { status: 400, message: 'New email must be different from the current email' };

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) throw { status: 402, message: 'Current password is incorrect' };   // should be 401 but changed based on the flutter developer request.

  const existing = await repo.findByEmail(newEmail);
  if (existing && existing.id !== userId) throw { status: 409, message: 'Email already exists' };

  const token = createEmailChangeToken({
    userId,
    currentEmail: user.email,
    newEmail,
  });
  const verificationUrl = new URL(`/api/v1/users/email-change/verify?token=${encodeURIComponent(token)}`, baseUrl).toString();

  await mailer.sendMail({
    to: newEmail,
    subject: 'Verify your new Tovo email address',
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: auto;">
        <h2>Confirm your new email address</h2>
        <p>We received a request to change the email address on your Tovo account.</p>
        <p>Your current email will remain active until you confirm the new one.</p>
        <p>
          <a href="${verificationUrl}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;">
            Verify New Email
          </a>
        </p>
        <p>If the button does not work, use this link:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>If you did not request this change, you can ignore this email.</p>
      </div>
    `,
  });

  return {
    pendingEmail: newEmail,
    message: 'Check your new email address for the verification link',
  };
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await repo.findById(userId);
  if (!user) throw { status: 404, message: 'User not found' };
  if (!user.passwordHash) throw { status: 400, message: 'Password is not set for this account' };

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) throw { status: 402, message: 'Current password is incorrect' };   // should be 401 but changed based on the flutter developer request

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await repo.updatePassword(userId, passwordHash);
};

const verifyEmailChange = async (token) => {
  const payload = verifyEmailChangeToken(token);
  if (payload.type !== 'email_change') {
    throw { status: 400, message: 'Invalid or expired email verification link' };
  }

  const user = await repo.findById(payload.userId);
  if (!user) throw { status: 404, message: 'User not found' };
  if (user.email !== payload.currentEmail) {
    throw { status: 400, message: 'Email change request is no longer valid' };
  }

  const existing = await repo.findByEmail(payload.newEmail);
  if (existing && existing.id !== payload.userId) {
    throw { status: 409, message: 'Email already exists' };
  }

  const updated = await repo.updateEmail(payload.userId, payload.newEmail);
  return {
    id: updated.id,
    email: updated.email,
  };
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

const getSavedAddresses = (userId) => repo.getSavedAddresses(userId);

const addAddress = (userId, data) => repo.createAddress({ userId, ...data });

const updateAddress = (id, userId, data) => repo.updateAddress(id, userId, data);

const deleteAddress = (id, userId) => repo.deleteAddress(id, userId);

// Admin methods
const listUsers = async (filters) => {
  const { page, limit, sortBy, sortOrder, search, status, dateFrom, dateTo } = filters;

  const where = { role: 'customer' };

  if (status === 'active') where.isActive = true;
  else if (status === 'suspended') where.isActive = false;
  else if (status === 'verified') where.isVerified = true;
  else if (status === 'unverified') where.isVerified = false;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const total = await repo.countUsers(where);

  const users = await repo.findManyUsers({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
  });

  const data = users.map((user) => ({
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
    walletBalance: user.wallet?.balance || 0,
    totalTrips: user.tripsAsCustomer.length,
    avgRating:
      user.ratingsGiven.length > 0
        ? (user.ratingsGiven.reduce((sum, r) => sum + r.stars, 0) / user.ratingsGiven.length).toFixed(1)
        : 0,
  }));

  return { data, total, pages: Math.ceil(total / limit) };
};

const getUserDetails = async (userId) => {
  const user = await repo.findUserWithDetails(userId);
  if (!user) return null;

  const completedTrips = user.tripsAsCustomer.filter((t) => t.status === 'completed').length;
  const cancelledTrips = user.tripsAsCustomer.filter((t) => t.status === 'cancelled').length;
  const totalSpent = user.tripsAsCustomer.reduce((sum, t) => sum + (t.finalFare ? parseFloat(t.finalFare) : 0), 0);

  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  user.ratingsGiven.forEach((r) => {
    ratingDistribution[r.stars] += 1;
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
      totalTrips: user.tripsAsCustomer.length,
      completedTrips,
      cancelledTrips,
      totalSpent,
    },
    ratingsStats: {
      avgRating:
        user.ratingsGiven.length > 0
          ? (user.ratingsGiven.reduce((sum, r) => sum + r.stars, 0) / user.ratingsGiven.length).toFixed(1)
          : 0,
      totalRatings: user.ratingsGiven.length,
      distribution: ratingDistribution,
    },
    savedAddresses: user.savedAddresses,
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

const suspendUser = async (userId, { action, reason, durationDays }) => {
  const user = await repo.findById(userId);
  if (!user) throw new Error('User not found');

  const isActive = action !== 'suspend';
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

const issueRefund = async (userId, refundData) => {
  const user = await repo.findById(userId);
  if (!user) throw new Error('User not found');

  let wallet = await repo.getWallet(userId);

  if (!wallet) {
    wallet = await repo.createWallet({
      userId,
      currency: refundData.currency,
      balance: refundData.amount,
    });
  } else {
    wallet = await repo.incrementWalletBalance(wallet.id, refundData.amount);
  }

  return {
    refundId: `REF-${Date.now()}`,
    userId,
    amount: refundData.amount,
    currency: refundData.currency,
    status: 'pending',
    tripId: refundData.tripId || null,
    reason: refundData.reason,
    notes: refundData.notes || null,
    createdAt: new Date(),
  };
};

const resetPassword = async (userId, newPassword) => {
  const user = await repo.findById(userId);
  if (!user) throw new Error('User not found');

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await repo.updateUser(userId, { passwordHash });
};

const adminDeleteUser = async (userId) => {
  const user = await repo.findById(userId);
  if (!user) throw new Error('User not found');

  await repo.deleteUser(userId);
};

const adminCreateUser = async (data) => {
  const existingEmail = await repo.findByEmail(data.email);
  if (existingEmail) throw new Error('Email already exists');

  if (data.phone) {
    const existingPhone = await repo.findByPhone(data.phone);
    if (existingPhone) throw new Error('Phone number already exists');
  }

  const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;

  const user = await repo.createUser({
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    passwordHash,
    language: data.language || 'en',
    isVerified: data.isVerified || false,
    role: 'customer',
  });

  return getUserDetails(user.id);
};

module.exports = {
  getProfile,
  updateProfile,
  requestEmailChange,
  changePassword,
  verifyEmailChange,
  updateAvatar,
  getWallet,
  getSavedAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  listUsers,
  getUserDetails,
  adminUpdateUser,
  suspendUser,
  issueRefund,
  resetPassword,
  adminDeleteUser,
  adminCreateUser,
};
