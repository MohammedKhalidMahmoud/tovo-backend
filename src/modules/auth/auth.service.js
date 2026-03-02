const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const repo = require('./auth.repository');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const prisma = require('../../config/prisma');

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 5;

// ─────────────────────────────────────────────────────────────────────────────
//  REGISTER USER
// ─────────────────────────────────────────────────────────────────────────────
const registerUser = async ({ name, email, phone, password }) => {
  const existingEmail = await repo.findUserByEmail(email);
  if (existingEmail) throw { status: 409, message: 'Email already registered' };

  const existingPhone = await repo.findUserByPhone(phone);
  if (existingPhone) throw { status: 409, message: 'Phone number already registered' };

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await repo.createUser({ name, email, phone, passwordHash, role: 'user' });

  // Create a wallet for the new user
  await prisma.wallet.create({ data: { userId: user.id, currency: 'EGP' } });

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
};

// ─────────────────────────────────────────────────────────────────────────────
//  REGISTER CAPTAIN
// ─────────────────────────────────────────────────────────────────────────────
const registerCaptain = async ({ name, email, phone, password, drivingLicense, vehicleTypeId, vin }) => {
  const existingEmail = await repo.findCaptainByEmail(email);
  if (existingEmail) throw { status: 409, message: 'Email already registered' };

  const existingPhone = await repo.findCaptainByPhone(phone);
  if (existingPhone) throw { status: 409, message: 'Phone number already registered' };

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const captain = await prisma.$transaction(async (tx) => {
    const newCaptain = await tx.captain.create({
      data: { name, email, phone, passwordHash, drivingLicense },
    });

    await tx.vehicle.create({
      data: { captainId: newCaptain.id, typeId: vehicleTypeId, vin },
    });

    await tx.wallet.create({ data: { captainId: newCaptain.id, currency: 'EGP' } });

    return newCaptain;
  });

  const { passwordHash: _, ...safeCaptain } = captain;
  return safeCaptain;
};

// ─────────────────────────────────────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────────────────────────────────────
const login = async ({ email, password, role }) => {
  let actor;
  if (role === 'user') {
    actor = await repo.findUserByEmail(email);
  } else if (role === 'captain') {
    actor = await repo.findCaptainByEmail(email);
  } else if (role === 'admin') {
    actor = await repo.findAdminByEmail(email);
  } else {
    throw { status: 400, message: 'Invalid role. Must be user, captain, or admin' };
  }

  if (!actor) throw { status: 401, message: 'Invalid credentials' };
  
  // Check if admin account is active
  if (role === 'admin' && !actor.isActive) {
    throw { status: 403, message: 'Admin account is deactivated' };
  }

  const isMatch = await bcrypt.compare(password, actor.passwordHash);
  if (!isMatch) throw { status: 401, message: 'Invalid credentials' };

  const payload = { id: actor.id, role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const tokenData = {
    token: refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };
  if (role === 'user') tokenData.userId = actor.id;
  else if (role === 'captain') tokenData.captainId = actor.id;
  // admin tokens stored without foreign key (RefreshToken model doesn't have adminId)

  await repo.createRefreshToken(tokenData);

  const { passwordHash: _, ...safeActor } = actor;
  return { accessToken, refreshToken, user: safeActor, role };
};

// ─────────────────────────────────────────────────────────────────────────────
//  LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
const logout = async (refreshToken, fcmToken) => {
  if (refreshToken) {
    await repo.deleteRefreshToken(refreshToken).catch(() => {}); // silent if not found
  }
  if (fcmToken) {
    await prisma.deviceToken.deleteMany({ where: { token: fcmToken } }).catch(() => {});
  }
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
//  REFRESH TOKEN
// ─────────────────────────────────────────────────────────────────────────────
const refreshToken = async (token) => {
  const stored = await repo.findRefreshToken(token);
  if (!stored || stored.expiresAt < new Date()) {
    throw { status: 401, message: 'Refresh token is invalid or expired' };
  }

  const decoded = verifyRefreshToken(token);
  const payload = { id: decoded.id, role: decoded.role };
  const newAccessToken = generateAccessToken(payload);

  return { accessToken: newAccessToken };
};

// ─────────────────────────────────────────────────────────────────────────────
//  OTP
// ─────────────────────────────────────────────────────────────────────────────
const sendOtp = async (phone) => {
  // const code = Math.floor(100000 + Math.random() * 900000).toString();
  const code= "123456"
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await repo.createOtp({ phone, code, expiresAt });

  // TODO: integrate SMS provider (Twilio, Vonage, etc.) here
  // await smsProvider.send(phone, `Your Tovo OTP is: ${code}`);

  return { message: `OTP sent to ${phone}` };
};

const verifyOtp = async (phone, code) => {
  const otp = await repo.findValidOtp(phone, code);
  if (!otp) throw { status: 400, message: 'Invalid or expired OTP' };

  await repo.markOtpUsed(otp.id);

  // Mark user/captain phone as verified
  await prisma.user.updateMany({ where: { phone }, data: { isVerified: true } });
  await prisma.captain.updateMany({ where: { phone }, data: { isVerified: true } });

  return { verified: true };
};

// ─────────────────────────────────────────────────────────────────────────────
//  FORGOT / RESET PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
const forgotPassword = async (email) => {
  // In production: generate a reset token, store it, send via email
  // Here we just confirm the email exists without exposing whether it does (security)
  return { message: 'If this email exists, a reset link has been sent.' };
};

const resetPassword = async (resetToken, newPassword) => {
  // In production: verify the reset token from DB, update password
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  // await prisma.user.update({ where: { resetToken }, data: { passwordHash } });
  return { message: 'Password updated successfully' };
};

// ─────────────────────────────────────────────────────────────────────────────
//  SOCIAL AUTH (OAuth placeholder)
// ─────────────────────────────────────────────────────────────────────────────
const socialAuth = async ({ provider, accessToken: oauthToken, role }) => {
  // TODO: validate token with provider (Facebook/Apple/Google) and upsert user
  // const profile = await verifyWithProvider(provider, oauthToken);
  throw { status: 501, message: 'Social auth not yet implemented' };
};

module.exports = {
  registerUser, registerCaptain, login, logout,
  refreshToken, sendOtp, verifyOtp,
  forgotPassword, resetPassword, socialAuth,
};
