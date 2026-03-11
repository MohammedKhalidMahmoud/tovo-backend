const bcrypt = require('bcryptjs');
const https = require('https');
const repo = require('./auth.repository');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const prisma = require('../../config/prisma');
const mailer = require('../../config/mailer');
const googleConfig = require('../../config/google');

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 5;
const RESET_OTP_EXPIRY_MINUTES = 10;

// ─────────────────────────────────────────────────────────────────────────────
//  REGISTER CUSTOMER
// ─────────────────────────────────────────────────────────────────────────────
const registerUser = async ({ name, email, phone, password }) => {
  const existingEmail = await repo.findUserByEmail(email);
  if (existingEmail) throw { status: 409, message: 'Email already registered' };

  const existingPhone = await repo.findUserByPhone(phone);
  if (existingPhone) throw { status: 409, message: 'Phone number already registered' };

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await repo.createUser({ name, email, phone, passwordHash, role: 'customer' });

  await prisma.wallet.create({ data: { userId: user.id, currency: 'EGP' } });

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
};

// ─────────────────────────────────────────────────────────────────────────────
//  REGISTER DRIVER
// ─────────────────────────────────────────────────────────────────────────────
const registerCaptain = async ({ name, email, phone, password, drivingLicense, vehicleModelName, vin }) => {
  const existingEmail = await repo.findUserByEmail(email);
  if (existingEmail) throw { status: 409, message: 'Email already registered' };

  const existingPhone = await repo.findUserByPhone(phone);
  if (existingPhone) throw { status: 409, message: 'Phone number already registered' };

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const vehicleModel = await prisma.vehicleModel.findUnique({
    where: { name: vehicleModelName },
    select: { id: true, isActive: true, serviceId: true },
  });
  if (!vehicleModel) throw { status: 400, message: 'Vehicle model is not recognised. Please choose from the available models.' };
  if (!vehicleModel.isActive) throw { status: 400, message: 'This vehicle model is no longer accepted for registration.' };

  const vehicleModelId = vehicleModel.id;
  const serviceId      = vehicleModel.serviceId ?? null;

  const driver = await prisma.$transaction(async (tx) => {
    const newDriver = await tx.user.create({
      data: { name, email, phone, passwordHash, drivingLicense, serviceId, role: 'driver' },
    });

    await tx.vehicle.create({
      data: { userId: newDriver.id, vehicleModelId, vin },
    });

    await tx.wallet.create({ data: { userId: newDriver.id, currency: 'EGP' } });

    return newDriver;
  });

  const { passwordHash: _, ...safeDriver } = driver;
  return safeDriver;
};

// ─────────────────────────────────────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────────────────────────────────────
const login = async ({ identifier, email: emailField, password, role }) => {
  // Accept `identifier` (email or phone) or fall back to legacy `email` field
  const raw = (identifier ?? emailField ?? '').trim();
  const isEmail = raw.includes('@');

  let actor;
  if (role === 'customer' || role === 'driver') {
    actor = isEmail
      ? await repo.findUserByEmail(raw)
      : await repo.findUserByPhone(raw);
    // Ensure the found user actually has the requested role
    if (actor && actor.role !== role) actor = null;
  } else if (role === 'admin') {
    actor = await repo.findAdminByEmail(raw);
  } else {
    throw { status: 400, message: 'Invalid role. Must be customer, driver, or admin' };
  }

  if (!actor) throw { status: 401, message: 'Invalid credentials' };

  if (role === 'admin' && !actor.isActive) {
    throw { status: 403, message: 'Admin account is deactivated' };
  }

  const isMatch = await bcrypt.compare(password, actor.passwordHash);
  if (!isMatch) throw { status: 401, message: 'Invalid credentials' };

  const payload = { id: actor.id, role };
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const tokenData = {
    token:     refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };
  if (role === 'customer' || role === 'driver') tokenData.userId = actor.id;
  // admin tokens stored without foreign key

  await repo.createRefreshToken(tokenData);

  const { passwordHash: _, ...safeActor } = actor;
  return { accessToken, refreshToken, user: safeActor, role };
};

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN LOGIN
// ─────────────────────────────────────────────────────────────────────────────
const adminLogin = async ({ email, password }) => {
  const actor = await repo.findAdminByEmail(email);
  if (!actor) throw { status: 401, message: 'Invalid credentials' };
  if (!actor.isActive) throw { status: 403, message: 'Admin account is deactivated' };

  const isMatch = await bcrypt.compare(password, actor.passwordHash);
  if (!isMatch) throw { status: 401, message: 'Invalid credentials' };

  const payload = { id: actor.id, role: 'admin' };
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await repo.createRefreshToken({ token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });

  const { passwordHash: _, ...safeActor } = actor;
  return { accessToken, refreshToken, user: safeActor, role: 'admin' };
};

// ─────────────────────────────────────────────────────────────────────────────
//  LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
const logout = async (refreshToken, fcmToken) => {
  if (refreshToken) {
    await repo.deleteRefreshToken(refreshToken).catch(() => {});
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
  const code = '123456';
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await repo.createOtp({ phone, code, expiresAt });

  // TODO: integrate SMS provider (Twilio, Vonage, etc.) here

  return { message: `OTP sent to ${phone}` };
};

const verifyOtp = async (phone, code) => {
  const otp = await repo.findValidOtp(phone, code);
  if (!otp) throw { status: 400, message: 'Invalid or expired OTP' };

  await repo.markOtpUsed(otp.id);

  // Mark matching user's phone as verified
  await prisma.user.updateMany({ where: { phone }, data: { isVerified: true } });

  return { verified: true };
};

// ─────────────────────────────────────────────────────────────────────────────
//  FORGOT / RESET PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
const forgotPassword = async (email) => {
  const user = await repo.findUserByEmail(email);
  // Always return same message to prevent email enumeration
  if (!user) return { message: 'If this email is registered, an OTP has been sent.' };

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + RESET_OTP_EXPIRY_MINUTES * 60 * 1000);

  await repo.createPasswordResetToken({ email, code, expiresAt });

  await mailer.sendMail({
    to: email,
    subject: 'Your Tovo Password Reset OTP',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Password Reset</h2>
        <p>Use the OTP below to reset your Tovo password:</p>
        <h1 style="letter-spacing: 8px;">${code}</h1>
        <p>This code expires in ${RESET_OTP_EXPIRY_MINUTES} minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  return { message: 'If this email is registered, an OTP has been sent.' };
};

const resetPassword = async (email, otp, newPassword) => {
  const token = await repo.findValidPasswordResetToken(email, otp);
  if (!token) throw { status: 400, message: 'Invalid or expired OTP' };

  await repo.markPasswordResetTokenUsed(token.id);

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { email }, data: { passwordHash } });

  return { message: 'Password updated successfully' };
};

// ─────────────────────────────────────────────────────────────────────────────
//  SOCIAL AUTH HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Verify a Google id_token and return { googleId, email, name } */
const verifyGoogleToken = async (idToken) => {
  const ticket = await googleConfig.verifyIdToken(idToken);
  const payload = ticket.getPayload();
  if (!payload) throw { status: 401, message: 'Invalid Google token' };
  return { googleId: payload.sub, email: payload.email, name: payload.name };
};

/** Verify a Facebook access_token via Graph API and return { facebookId, email, name } */
const verifyFacebookToken = (accessToken) =>
  new Promise((resolve, reject) => {
    const url = `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`;
    https.get(url, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        const data = JSON.parse(raw);
        if (data.error) return reject({ status: 401, message: `Facebook: ${data.error.message}` });
        if (!data.id)   return reject({ status: 401, message: 'Invalid Facebook token' });
        resolve({ facebookId: data.id, email: data.email ?? null, name: data.name });
      });
    }).on('error', () => reject({ status: 502, message: 'Could not reach Facebook API' }));
  });

/** Issue Tovo JWTs for a verified user */
const issueSocialTokens = async (user) => {
  const payload = { id: user.id, role: user.role };
  const accessToken  = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  await repo.createRefreshToken({
    token: refreshToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  const { passwordHash: _, ...safeUser } = user;
  return { accessToken, refreshToken, user: safeUser, role: user.role };
};

/** Find-or-create a user from verified social profile data */
const findOrCreateSocialUser = async ({ idField, idValue, email, name, role }) => {
  // 1. Look up by social ID
  let user = await repo[idField === 'googleId' ? 'findUserByGoogleId' : 'findUserByFacebookId'](idValue);

  if (user) {
    if (user.role !== role) throw { status: 409, message: 'An account with this social identity exists under a different role' };
    return user;
  }

  // 2. Look up by email (link social ID to existing account)
  if (email) {
    user = await repo.findUserByEmail(email);
    if (user) {
      if (user.role !== role) throw { status: 409, message: 'An account with this email exists under a different role' };
      // Link social ID to the existing account
      user = await prisma.user.update({ where: { id: user.id }, data: { [idField]: idValue } });
      return user;
    }
  }

  // 3. Create new user (no phone — social auth users may not provide one)
  return prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { name: name ?? 'User', email, [idField]: idValue, role, isVerified: true },
    });
    await tx.wallet.create({ data: { userId: newUser.id, currency: 'EGP' } });
    return newUser;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
//  SOCIAL AUTH
// ─────────────────────────────────────────────────────────────────────────────
const socialAuth = async ({ provider, access_token, role }) => {
  let profile;

  if (provider === 'google') {
    profile = await verifyGoogleToken(access_token);
    profile.idField = 'googleId';
    profile.idValue = profile.googleId;
  } else if (provider === 'facebook') {
    profile = await verifyFacebookToken(access_token);
    profile.idField = 'facebookId';
    profile.idValue = profile.facebookId;
  } else {
    throw { status: 400, message: `Provider '${provider}' is not supported` };
  }

  const user = await findOrCreateSocialUser({ ...profile, role });
  return issueSocialTokens(user);
};

module.exports = {
  registerUser, registerCaptain, login, adminLogin, logout,
  refreshToken, sendOtp, verifyOtp,
  forgotPassword, resetPassword, socialAuth,
};
