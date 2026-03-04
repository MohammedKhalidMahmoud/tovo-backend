// ════════════════════════════════════════════════════════════════════════════════
// Services - Admin Routes
// Path: src/modules/admin/services/services.routes.js
// Mounted at: /api/v1/admin/services
// ════════════════════════════════════════════════════════════════════════════════

const router   = require('express').Router();
const { body, param } = require('express-validator');
const ctrl     = require('./services.controller');
const validate = require('../../../middleware/validate.middleware');

router.get('/', ctrl.listServices);

router.get('/:id', [param('id').isUUID()], validate, ctrl.getService);

// POST /admin/services — create a new service
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

router.post(
  '/', validate, ctrl.createService
);
module.exports = router;
