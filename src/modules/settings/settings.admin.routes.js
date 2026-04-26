const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl = require('./settings.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/', authenticate, requirePermission('settings:read'), ctrl.getPublicSettings);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/all', authenticate, requirePermission('settings:read'), ctrl.listSettings);

router.post('/', authenticate, requirePermission('settings:manage'), [
  body('key').trim().notEmpty().withMessage('key is required')
    .matches(/^[a-z0-9_.]+$/).withMessage('key must be lowercase alphanumeric with dots or underscores'),
  body('value').notEmpty().withMessage('value is required'),
], validate, ctrl.createSetting);

router.patch('/:id', authenticate, requirePermission('settings:manage'), [
  param('id').isUUID(),
  body('key').optional().trim().notEmpty()
    .matches(/^[a-z0-9_.]+$/).withMessage('key must be lowercase alphanumeric with dots or underscores'),
  body('value').optional().notEmpty().withMessage('value cannot be empty'),
], validate, ctrl.updateSetting);

router.delete('/:id', authenticate, requirePermission('settings:manage'), [
  param('id').isUUID(),
], validate, ctrl.deleteSetting);

module.exports = router;
