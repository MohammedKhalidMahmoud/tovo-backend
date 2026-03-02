const service = require('./notifications.service');
const { success, created, paginate } = require('../../utils/response');

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, per_page = 20 } = req.query;
    const result = await service.getNotifications(req.actor.id, +page, +per_page);
    return success(res, result.notifications, 'Success', 200, paginate(page, per_page, result.total));
  } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try {
    await service.markRead(req.params.id, req.actor.id);
    return success(res, {}, 'Marked as read');
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await service.markAllRead(req.actor.id);
    return success(res, {}, 'All notifications marked as read');
  } catch (err) { next(err); }
};

const registerDeviceToken = async (req, res, next) => {
  try {
    const { token, platform } = req.body;
    const userId = req.actor.role === 'user' ? req.actor.id : null;
    const captainId = req.actor.role === 'captain' ? req.actor.id : null;
    await service.registerDeviceToken(userId, captainId, token, platform);
    return success(res, {}, 'Device token registered');
  } catch (err) { next(err); }
};

// ── Admin: FCM push endpoints ─────────────────────────────────────────────────

const sendToUser = async (req, res, next) => {
  try {
    const { user_id, title, body, data } = req.body;
    const result = await service.sendToUser(user_id, title, body, data);
    return success(res, result, 'Notification sent');
  } catch (err) { next(err); }
};

const sendToCaptain = async (req, res, next) => {
  try {
    const { captain_id, title, body, data } = req.body;
    const result = await service.sendToCaptain(captain_id, title, body, data);
    return success(res, result, 'Notification sent');
  } catch (err) { next(err); }
};

module.exports = { getNotifications, markRead, markAllRead, registerDeviceToken, sendToUser, sendToCaptain };
