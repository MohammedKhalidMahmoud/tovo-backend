// ── REPOSITORY ────────────────────────────────────────────────────────────────
const prisma = require('../../config/prisma');

const findByUser = (userId, skip, take) =>
  Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.notification.count({ where: { userId } }),
  ]);

const markRead = (id, userId) =>
  prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });

const markAllRead = (userId) =>
  prisma.notification.updateMany({ where: { userId }, data: { isRead: true } });

const upsertDeviceToken = (data) =>
  prisma.deviceToken.upsert({ where: { token: data.token }, update: data, create: data });

const createNotification = (data) =>
  prisma.notification.create({ data });

// ── Device token helpers for FCM ──────────────────────────────────────────────

const getTokensByUserId = (userId) =>
  prisma.deviceToken.findMany({ where: { userId }, select: { token: true } });

/** Remove invalid/expired tokens returned by FCM as failures */
const deleteTokensByList = (tokens) =>
  prisma.deviceToken.deleteMany({ where: { token: { in: tokens } } });

/** Remove a single device token on logout */
const deleteToken = (token) =>
  prisma.deviceToken.deleteMany({ where: { token } });

module.exports = {
  findByUser, markRead, markAllRead, upsertDeviceToken,
  createNotification,
  getTokensByUserId, deleteTokensByList, deleteToken,
};
