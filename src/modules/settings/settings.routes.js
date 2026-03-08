const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl = require('./settings.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/', ctrl.getPublicSettings);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/all', authenticate, authorize('admin'), ctrl.listSettings);

router.post('/', authenticate, authorize('admin'), [
  body('key').trim().notEmpty().withMessage('key is required')
    .matches(/^[a-z0-9_.]+$/).withMessage('key must be lowercase alphanumeric with dots or underscores'),
  body('value').notEmpty().withMessage('value is required'),
], validate, ctrl.createSetting);

router.patch('/:id', authenticate, authorize('admin'), [
  param('id').isUUID(),
  body('key').optional().trim().notEmpty()
    .matches(/^[a-z0-9_.]+$/).withMessage('key must be lowercase alphanumeric with dots or underscores'),
  body('value').optional().notEmpty().withMessage('value cannot be empty'),
], validate, ctrl.updateSetting);

router.delete('/:id', authenticate, authorize('admin'), [
  param('id').isUUID(),
], validate, ctrl.deleteSetting);

module.exports = router;
