const prisma = require('../../config/prisma');

// ── USER ─────────────────────────────────────────────────────────────────────

const findUserByEmail = (email) =>
  prisma.user.findUnique({ where: { email } });

const findUserByPhone = (phone) =>
  prisma.user.findUnique({ where: { phone } });

const findUserById = (id) =>
  prisma.user.findUnique({ where: { id } });

const createUser = (data) =>
  prisma.user.create({ data });

// ── CAPTAIN ───────────────────────────────────────────────────────────────────

const findCaptainByEmail = (email) =>
  prisma.captain.findUnique({ where: { email } });

const findCaptainByPhone = (phone) =>
  prisma.captain.findUnique({ where: { phone } });

const findCaptainById = (id) =>
  prisma.captain.findUnique({ where: { id }, include: { vehicle: { include: { vehicleModel: true } } } });

const createCaptain = (data) =>
  prisma.captain.create({ data });

// ── ADMIN ──────────────────────────────────────────────────────────────────────

const findAdminByEmail = (email) =>
  prisma.adminUser.findUnique({ where: { email } });

const findAdminById = (id) =>
  prisma.adminUser.findUnique({ where: { id } });

// ── REFRESH TOKEN ─────────────────────────────────────────────────────────────

const createRefreshToken = (data) =>
  prisma.refreshToken.create({ data });

const findRefreshToken = (token) =>
  prisma.refreshToken.findFirst({ where: { token } });

const deleteRefreshToken = (token) =>
  prisma.refreshToken.delete({ where: { token } });

const deleteAllRefreshTokens = (userId, captainId) => {
  const where = userId ? { userId } : { captainId };
  return prisma.refreshToken.deleteMany({ where });
};

// ── OTP ───────────────────────────────────────────────────────────────────────

const createOtp = (data) =>
  prisma.otp.create({ data });

const findValidOtp = (phone, code) =>
  prisma.otp.findFirst({
    where: { phone, code, isUsed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

const markOtpUsed = (id) =>
  prisma.otp.update({ where: { id }, data: { isUsed: true } });

module.exports = {
  findUserByEmail, findUserByPhone, findUserById, createUser,
  findCaptainByEmail, findCaptainByPhone, findCaptainById, createCaptain,
  findAdminByEmail, findAdminById,
  createRefreshToken, findRefreshToken, deleteRefreshToken, deleteAllRefreshTokens,
  createOtp, findValidOtp, markOtpUsed,
};
