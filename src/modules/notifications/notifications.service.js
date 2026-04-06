// ── SERVICE ─────────────────────────────────────────────────────────────────
const repo = require('./notifications.repository');
const fcm  = require('../../providers/fcm');

const getNotifications = async (userId, page = 1, perPage = 20) => {
  const skip = (page - 1) * perPage;
  const [notifications, total] = await repo.findByUser(userId, skip, perPage);
  return { notifications, total, page, perPage };
};

const markRead = (id, userId) => repo.markRead(id, userId);
const markAllRead = (userId) => repo.markAllRead(userId);
const registerDeviceToken = (userId, token, platform) =>
  repo.upsertDeviceToken({ userId, token, platform });

const _sendAndClean = async (tokens, title, body, data) => {
  const result = await fcm.sendMulticast(tokens, { title, body, data });
  if (result.failedTokens.length) await repo.deleteTokensByList(result.failedTokens);
  return { sent: result.successCount, failed: result.failureCount };
};

const sendToUser = async (userId, title, body, data = {}) => {
  const records = await repo.getTokensByUserId(userId);
  const tokens = records.map(r => r.token);
  if (!tokens.length) return { sent: 0, failed: 0 };
  return _sendAndClean(tokens, title, body, data);
};

const sendToDriver = async (driverId, title, body, data = {}) => {
  const records = await repo.getTokensByUserId(driverId);
  const tokens = records.map(r => r.token);
  if (!tokens.length) return { sent: 0, failed: 0 };
  return _sendAndClean(tokens, title, body, data);
};

const sendToActor = (actorId, role, title, body, data = {}) =>
  role === 'driver'
    ? sendToDriver(actorId, title, body, data)
    : sendToUser(actorId, title, body, data);

const sendBulk = async (tokens, title, body, data = {}) => {
  if (!tokens.length) return { sent: 0, failed: 0 };
  return _sendAndClean(tokens, title, body, data);
};

const createAndSend = async (userId, title, body, data = {}) => {
  await repo.createNotification({ userId, title, body });
  return sendToUser(userId, title, body, data);
};

module.exports = {
  getNotifications, markRead, markAllRead, registerDeviceToken,
  sendToUser, sendToDriver, sendToActor, sendBulk, createAndSend,
};
