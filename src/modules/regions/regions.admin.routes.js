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

const validateRegionPoints = (required = false) =>
  body('points').custom((value) => {
    if (value == null) {
      if (required) throw new Error('points is required');
      return true;
    }

    if (!Array.isArray(value) || value.length < 3) {
      throw new Error('points must contain at least 3 coordinates');
    }

    value.forEach((point, index) => {
      const lat = Number(point?.lat);
      const lng = Number(point?.lng);

      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        throw new Error(`points[${index}].lat must be between -90 and 90`);
      }

      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        throw new Error(`points[${index}].lng must be between -180 and 180`);
      }
    });

    return true;
  });

router.get('/', ...adminRead, ctrl.listRegions);

router.post(
  '/',
  ...adminManage,
  [
    body('name').trim().isLength({ min: 1 }).withMessage('name is required'),
    body('city').optional().trim(),
    validateRegionPoints(true),
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
    body('city').optional().trim(),
    validateRegionPoints(false),
    body('status').optional().isBoolean(),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  ctrl.updateRegion
);

router.delete('/:id', ...adminManage, [param('id').isUUID()], validate, ctrl.deleteRegion);

module.exports = router;
