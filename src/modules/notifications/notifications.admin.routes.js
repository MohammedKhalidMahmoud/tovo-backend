const router = require('express').Router();
const { body, param } = require('express-validator');
const controller = require('./notifications.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');

// ── Admin: manual FCM push ────────────────────────────────────────────────────
router.post('/send-to-user', authenticate, requirePermission('layout:manage'), [
  body('user_id').notEmpty().isUUID(),
  body('title').notEmpty(),
  body('body').notEmpty(),
  body('data').optional().isObject(),
], validate, controller.sendToUser);

router.post('/send-to-driver', authenticate, requirePermission('layout:manage'), [
  body('driver_id').notEmpty().isUUID(),
  body('title').notEmpty(),
  body('body').notEmpty(),
  body('data').optional().isObject(),
], validate, controller.sendToDriver);

router.post('/send-to-audience', authenticate, requirePermission('layout:manage'), [
  body('audience').isIn(['drivers', 'riders', 'all']),
  body('title').notEmpty(),
  body('body').notEmpty(),
  body('data').optional().isObject(),
], validate, controller.sendToAudience);

module.exports = router;
