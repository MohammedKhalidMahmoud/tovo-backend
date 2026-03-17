// ════════════════════════════════════════════════════════════════════════════════
// Vehicle Models - Admin Routes
// Mounted at: /api/v1/admin/vehicle-models
// ════════════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const { body, param, query } = require('express-validator');
const ctrl = require('./vehicleModels.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const adminOnly = [authenticate, authorize('admin')];

// GET /admin/vehicle-models — list all models
router.get('/', ...adminOnly, ctrl.listModels);

// GET /admin/vehicle-models/:id — get single model
router.get('/:id', ...adminOnly, [param('id').isUUID()], validate, ctrl.getModel);

// POST /admin/vehicle-models — create new allowed model
router.post(
  '/',
  ...adminOnly,
  [
    body('name').trim().isLength({ min: 1 }).withMessage('name is required'),
    body('brand').trim().isLength({ min: 1 }).withMessage('brand is required'),
    body('serviceId').isUUID().withMessage('serviceId is required and must be a valid UUID'),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  ctrl.createModel,
);

// PUT /admin/vehicle-models/:id — update model
router.put(
  '/:id',
  ...adminOnly,
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1 }),
    body('brand').optional().trim().isLength({ min: 1 }),
    body('serviceId').optional().isUUID().withMessage('serviceId must be a valid UUID'),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  ctrl.updateModel,
);

// DELETE /admin/vehicle-models/:id?confirm=true — delete model
router.delete(
  '/:id',
  ...adminOnly,
  [param('id').isUUID(), query('confirm').equals('true').withMessage('confirm=true is required')],
  validate,
  ctrl.deleteModel,
);

module.exports = router;
