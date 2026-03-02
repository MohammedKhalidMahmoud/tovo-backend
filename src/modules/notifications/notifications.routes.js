const router = require('express').Router();
const { body, param } = require('express-validator');
const controller = require('./notifications.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireAdminKey } = require('../../middleware/adminKey.middleware');

// ── User-facing ───────────────────────────────────────────────────────────────
router.get('/',                   authenticate, controller.getNotifications);
router.patch('/read-all',         authenticate, controller.markAllRead);
router.patch('/:id/read',         authenticate, [
  param('id').isUUID(),
], validate, controller.markRead);
router.post('/device-token',      authenticate, [
  body('token').notEmpty(),
  body('platform').isIn(['ios', 'android', 'web']),
], validate, controller.registerDeviceToken);

// ── Admin: push via FCM (protected by X-Admin-Key header) ────────────────────
router.post('/send-to-user', requireAdminKey, [
  body('user_id').notEmpty().isUUID(),
  body('title').notEmpty(),
  body('body').notEmpty(),
  body('data').optional().isObject(),
], validate, controller.sendToUser);

router.post('/send-to-captain', requireAdminKey, [
  body('captain_id').notEmpty().isUUID(),
  body('title').notEmpty(),
  body('body').notEmpty(),
  body('data').optional().isObject(),
], validate, controller.sendToCaptain);

module.exports = router;
