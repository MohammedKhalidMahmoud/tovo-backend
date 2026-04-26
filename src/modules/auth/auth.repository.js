const prisma = require('../../config/prisma');

const findUserByEmail = (email) =>
  prisma.user.findUnique({ where: { email } });

const findUserByPhone = (phone) =>
  prisma.user.findUnique({ where: { phone } });

const findUserById = (id) =>
  prisma.user.findUnique({ where: { id } });

const findUserByGoogleId = (googleId) =>
  prisma.user.findUnique({ where: { googleId } });

const findUserByFacebookId = (facebookId) =>
  prisma.user.findUnique({ where: { facebookId } });

const findUserByAppleId = (appleId) =>
  prisma.user.findUnique({ where: { appleId } });

const createUser = (data) =>
  prisma.user.create({ data });

const findAdminByEmail = (email) =>
  prisma.adminUser.findUnique({
    where: { email },
    include: {
      dashboardRole: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

const findAdminById = (id) =>
  prisma.adminUser.findUnique({
    where: { id },
    include: {
      dashboardRole: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

const createRefreshToken = (data) =>
  prisma.refreshToken.create({ data });

const findRefreshToken = (token) =>
  prisma.refreshToken.findFirst({ where: { token } });

const deleteRefreshToken = (token) =>
  prisma.refreshToken.deleteMany({ where: { token } });

const deleteAllRefreshTokens = (userId) =>
  prisma.refreshToken.deleteMany({ where: { userId } });

const createPasswordResetToken = (data) =>
  prisma.passwordResetToken.create({ data });

const findValidPasswordResetToken = (email, code) =>
  prisma.passwordResetToken.findFirst({
    where: { email, code, isUsed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

const markPasswordResetTokenUsed = (id) =>
  prisma.passwordResetToken.update({ where: { id }, data: { isUsed: true } });

module.exports = {
  findUserByEmail,
  findUserByPhone,
  findUserById,
  findUserByGoogleId,
  findUserByFacebookId,
  findUserByAppleId,
  createUser,
  findAdminByEmail,
  findAdminById,
  createRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteAllRefreshTokens,
  createPasswordResetToken,
  findValidPasswordResetToken,
  markPasswordResetTokenUsed,
};
