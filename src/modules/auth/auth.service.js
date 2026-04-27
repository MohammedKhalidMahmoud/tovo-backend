const bcrypt = require('bcryptjs');
const https = require('https');
const repo = require('./auth.repository');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const prisma = require('../../config/prisma');
const getAdmin = require('../../config/firebase');
const mailer = require('../../config/mailer');
const googleConfig = require('../../config/google');
const appleConfig = require('../../config/apple');

const SALT_ROUNDS = 12;
const RESET_OTP_EXPIRY_MINUTES = 10;

const assertActiveActor = async ({ id, role }) => {
  if (role === 'admin') {
    const admin = await prisma.adminUser.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!admin || !admin.isActive) {
      throw { status: 402, message: 'Refresh token is invalid or expired' };  // should be 401 but changed bsed on the flutter developer request
    }

    return { id: admin.id, role: 'admin' };
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });

  if (!user || user.role !== role) {
    throw { status: 402, message: 'Refresh token is invalid or expired' };   // should be 401 but changed bsed on the flutter developer request  // should be 401 but changed bsed on the flutter developer request
  }

  return { id: user.id, role: user.role };
};

const issueUserTokens = async (user) => {
  const payload = { id: user.id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await repo.createRefreshToken({
    token: refreshToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const { passwordHash: _, ...safeUser } = user;
  return { accessToken, refreshToken, user: safeUser, role: user.role };
};

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

const registerDriver = async ({ name, email, phone, password, driving_license, vehicle_model_id, vin }) => {
  const existingEmail = await repo.findUserByEmail(email);
  if (existingEmail) throw { status: 409, message: 'Email already registered' };

  const existingPhone = await repo.findUserByPhone(phone);
  if (existingPhone) throw { status: 409, message: 'Phone number already registered' };

  const vehicleModel = await prisma.vehicleModel.findUnique({
    where: { id: vehicle_model_id },
    select: {
      id: true,
      isActive: true,
      supportedInServices: {
        select: {
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
  if (!vehicleModel) throw { statusCode: 404, message: 'Vehicle model not found' };
  if (!vehicleModel.isActive) throw { status: 400, message: 'This vehicle model is no longer accepted for registration.' };

  const enrolledServices = vehicleModel.supportedInServices
    .map(({ service }) => service)
    .filter(Boolean);

  if (enrolledServices.length === 0) {
    throw { statusCode: 400, message: 'Vehicle model supports no services' };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const driver = await prisma.$transaction(async (tx) => {
    const newDriver = await tx.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: 'driver',
        driverProfile: {
          create: {
            drivingLicense: driving_license,
          },
        },
      },
    });

    await tx.vehicle.create({
      data: { userId: newDriver.id, vehicleModelId: vehicle_model_id, vin },
    });

    await tx.driverService.createMany({
      data: enrolledServices.map((service) => ({
        driverId: newDriver.id,
        serviceId: service.id,
      })),
    });

    await tx.wallet.create({ data: { userId: newDriver.id, currency: 'EGP' } });

    return newDriver;
  });

  const { passwordHash: _, ...safeDriver } = driver;
  return { driver: safeDriver, enrolledServices };
};

const login = async ({ identifier, email: emailField, password }) => {
  const raw = (identifier ?? emailField ?? '').trim();
  const isEmail = raw.includes('@');
  const actor = isEmail
    ? await repo.findUserByEmail(raw)
    : await repo.findUserByPhone(raw);

  if (!actor) throw { status: 402, message: 'Invalid credentials' };   // should be 401 but changed bsed on the flutter developer request
  if (!['customer', 'driver'].includes(actor.role)) throw { status: 402, message: 'Invalid credentials' };   // should be 401 but changed bsed on the flutter developer request

  const isMatch = await bcrypt.compare(password, actor.passwordHash);
  if (!isMatch) throw { status: 402, message: 'Invalid credentials' };  // should be 401 but changed bsed on the flutter developer request

  return issueUserTokens(actor);
};

const adminLogin = async ({ email, password }) => {
  const actor = await repo.findAdminByEmail(email);
  if (!actor) throw { status: 402, message: 'Invalid credentials' };  // should be 401 but changed bsed on the flutter developer request
  if (!actor.isActive) throw { status: 403, message: 'Admin account is deactivated' };

  const isMatch = await bcrypt.compare(password, actor.passwordHash);
  if (!isMatch) throw { status: 402, message: 'Invalid credentials' };  // should be 401 but changed bsed on the flutter developer request

  const payload = { id: actor.id, role: 'admin' };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await repo.createRefreshToken({ token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });

  const { passwordHash: _, ...safeActor } = actor;
  const permissions = safeActor.dashboardRole?.permissions.map(({ permission }) => permission.key) || [];
  const dashboardRole = safeActor.dashboardRole
    ? {
        id: safeActor.dashboardRole.id,
        name: safeActor.dashboardRole.name,
        description: safeActor.dashboardRole.description,
        isSystem: safeActor.dashboardRole.isSystem,
      }
    : null;

  return {
    accessToken,
    refreshToken,
    user: {
      ...safeActor,
      dashboardRole,
      permissions,
    },
  };
};

const logout = async (actor, refreshToken, fcmToken) => {
  if (refreshToken) {
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw { status: 402, message: 'Refresh token is invalid or expired' };   // // should be 401 but changed bsed on the flutter developer request
    }

    const actorTokenRole = actor.role || (typeof actor.isAdmin === 'boolean' ? 'admin' : undefined);
    if (decoded.id !== actor.id || decoded.role !== actorTokenRole) {
      throw { status: 403, message: 'Refresh token does not belong to the authenticated actor' };
    }

    const stored = await repo.findRefreshToken(refreshToken);
    if (stored && stored.userId && stored.userId !== actor.id) {
      throw { status: 403, message: 'Refresh token does not belong to the authenticated actor' };
    }

    await repo.deleteRefreshToken(refreshToken);
  }
  if (fcmToken) {
    await prisma.deviceToken.deleteMany({ where: { token: fcmToken, userId: actor.id } });
  }
  return true;
};

const refreshToken = async (token) => {
  const stored = await repo.findRefreshToken(token);
  if (!stored || stored.expiresAt < new Date()) {
    throw { status: 402, message: 'Refresh token is invalid or expired' };   // // should be 401 but changed bsed on the flutter developer request
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    throw { status: 402, message: 'Refresh token is invalid or expired' };   // // should be 401 but changed bsed on the flutter developer request
  }

  if (stored.userId && stored.userId !== decoded.id) {
    throw { status: 402, message: 'Refresh token is invalid or expired' };   // // should be 401 but changed bsed on the flutter developer request
  }

  const actor = await assertActiveActor({ id: decoded.id, role: decoded.role });
  const payload = { id: actor.id, role: actor.role };
  const newAccessToken = generateAccessToken(payload);

  return { accessToken: newAccessToken };
};

const verifyOtp = async (idToken) => {
  let adminAuth;
  try {
    adminAuth = getAdmin().auth();
  } catch (err) {
    throw { status: 500, message: 'Phone authentication is not configured' };
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch (err) {
    throw { status: 402, message: 'Invalid or expired Firebase ID token' };   // // should be 401 but changed bsed on the flutter developer request
  }

  if (decoded.firebase?.sign_in_provider !== 'phone') {
    throw { status: 402, message: 'Firebase token is not a phone authentication token' };   // // should be 401 but changed bsed on the flutter developer request
  }

  const phone = decoded.phone_number;
  if (!phone) {
    throw { status: 400, message: 'Phone number is missing from the Firebase token' };
  }

  const existingUser = await repo.findUserByPhone(phone);
  if (!existingUser) {
    return {
      flow: 'register',
      requiresRegistration: true,
      verified: true,
      phone,
    };
  }

  const user = existingUser.isVerified
    ? existingUser
    : await prisma.user.update({
        where: { id: existingUser.id },
        data: { isVerified: true },
      });

  return {
    flow: 'login',
    verified: true,
    ...(await issueUserTokens(user)),
  };
};

const forgotPassword = async (email) => {
  const user = await repo.findUserByEmail(email);
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

const verifyGoogleToken = async (idToken) => {
  const ticket = await googleConfig.verifyIdToken(idToken);
  const payload = ticket.getPayload();
  if (!payload) throw { status: 402, message: 'Invalid Google token' };  // should be 401 but changed bsed on the flutter developer request
  return { googleId: payload.sub, email: payload.email, name: payload.name };
};

const verifyAppleToken = async (idToken) => {
  const payload = await appleConfig.verifyIdToken(idToken);
  if (!payload || !payload.sub) throw { status: 402, message: 'Invalid Apple token' };  // should be 401 but changed bsed on the flutter developer request
  return { appleId: payload.sub, email: payload.email ?? null, name: null };
};

const verifyFacebookToken = (accessToken) =>
  new Promise((resolve, reject) => {
    const url = `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`;
    https.get(url, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        const data = JSON.parse(raw);
        if (data.error) return reject({ status: 402, message: `Facebook: ${data.error.message}` });  // should be 401 but changed bsed on the flutter developer request
        if (!data.id) return reject({ status: 402, message: 'Invalid Facebook token' });  // should be 401 but changed bsed on the flutter developer request
        resolve({ facebookId: data.id, email: data.email ?? null, name: data.name });
      });
    }).on('error', () => reject({ status: 502, message: 'Could not reach Facebook API' }));
  });

const SOCIAL_FINDERS = {
  googleId: (id) => repo.findUserByGoogleId(id),
  facebookId: (id) => repo.findUserByFacebookId(id),
  appleId: (id) => repo.findUserByAppleId(id),
};

const findOrCreateSocialUser = async ({ idField, idValue, email, name, role }) => {
  let user = await SOCIAL_FINDERS[idField](idValue);

  if (user) {
    if (user.role !== role) throw { status: 409, message: 'An account with this social identity exists under a different role' };
    return user;
  }

  if (email) {
    user = await repo.findUserByEmail(email);
    if (user) {
      if (user.role !== role) throw { status: 409, message: 'An account with this email exists under a different role' };
      user = await prisma.user.update({ where: { id: user.id }, data: { [idField]: idValue } });
      return user;
    }
  }

  return prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { name: name ?? 'User', email, [idField]: idValue, role, isVerified: true },
    });
    await tx.wallet.create({ data: { userId: newUser.id, currency: 'EGP' } });
    return newUser;
  });
};

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
  } else if (provider === 'apple') {
    profile = await verifyAppleToken(access_token);
    profile.idField = 'appleId';
    profile.idValue = profile.appleId;
  } else {
    throw { status: 400, message: `Provider '${provider}' is not supported` };
  }

  const user = await findOrCreateSocialUser({ ...profile, role });
  return issueUserTokens(user);
};

module.exports = {
  registerUser,
  registerDriver,
  login,
  adminLogin,
  logout,
  refreshToken,
  verifyOtp,
  forgotPassword,
  resetPassword,
  socialAuth,
};
