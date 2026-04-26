// ════════════════════════════════════════════════════════════════════════════════
// Regions - Admin Routes
// Path: src/modules/admin/regions/regions.routes.js
// Mounted at: /api/v1/admin/regions
// ════════════════════════════════════════════════════════════════════════════════

const router   = require('express').Router();
const { body, param } = require('express-validator');
const ctrl     = require('./regions.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');

const adminRead = [authenticate, requirePermission('regions:read')];
const adminManage = [authenticate, requirePermission('regions:manage')];

router.get('/', ...adminRead, ctrl.listRegions);

router.post(
  '/',
  ...adminManage,
  [
    body('name').trim().isLength({ min: 1 }).withMessage('name is required'),
    // body('country').trim().isLength({ min: 1 }).withMessage('country is required'),
    body('city').optional().trim(),
    body('lat').optional().isFloat({ min: -90,  max: 90  }).withMessage('lat must be between -90 and 90'),
    body('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('lng must be between -180 and 180'),
    body('radius').optional().isFloat({ min: 0.1 }).withMessage('radius must be a positive number (in km)'),
    body('status').optional().isBoolean(),
  ],
  validate,
  ctrl.createRegion
);

router.get('/:id', ...adminRead, [param('id').isUUID()], validate, ctrl.getRegion);

router.put(
  '/:id',
  ...adminManage,
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1 }).withMessage('name must not be empty'),
    body('country').optional().trim().isLength({ min: 1 }).withMessage('country must not be empty'),
    body('city').optional().trim(),
    body('lat').optional().isFloat({ min: -90,  max: 90  }).withMessage('lat must be between -90 and 90'),
    body('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('lng must be between -180 and 180'),
    body('radius').optional().isFloat({ min: 0.1 }).withMessage('radius must be a positive number (in km)'),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  ctrl.updateRegion
);

router.delete('/:id', ...adminManage, [param('id').isUUID()], validate, ctrl.deleteRegion);

module.exports = router;
