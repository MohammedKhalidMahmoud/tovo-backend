// ════════════════════════════════════════════════════════════════════════════════
// Services - Public Routes
// Path: src/modules/services/services.routes.js
// Mounted at: /api/v1/services
// ════════════════════════════════════════════════════════════════════════════════
const router  = require('express').Router();
const { param, body } = require('express-validator');
const validate = require('../../middleware/validate.middleware');
const ctrl = require('./services.controller');

router.get('/', ctrl.listServices);

router.get('/:id', [param('id').isUUID()], validate, ctrl.getService);

router.post(
  '/',
  [
    body('name').notEmpty().trim().withMessage('name is required'),
    body('baseFare').optional().isFloat({ min: 0 }).withMessage('baseFare must be a non-negative number'),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  ctrl.createService
);

router.patch(
  '/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1 }).withMessage('name must not be empty'),
    body('baseFare').optional().isFloat({ min: 0 }).withMessage('baseFare must be a non-negative number'),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  ctrl.updateService
);

module.exports = router;
