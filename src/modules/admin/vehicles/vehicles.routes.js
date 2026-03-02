// ════════════════════════════════════════════════════════════════════════════════
// Vehicle Types - Admin Routes
// Path: src/modules/admin/vehicles/vehicles.routes.js
// Mounted at: /api/v1/admin/vehicle-types
// ════════════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const { body, param, query } = require('express-validator');
const controller = require('./vehicles.controller');
const validate = require('../../../middleware/validate.middleware');

router.get('/', controller.listVehicleTypes);

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 1 }).withMessage('name is required'),
    body('description').optional().trim().isLength({ max: 500 }),
    body('imageUrl').optional().isURL().withMessage('imageUrl must be a valid URL'),
  ],
  validate,
  controller.createVehicleType
);

router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('imageUrl').optional().isURL().withMessage('imageUrl must be a valid URL'),
  ],
  validate,
  controller.updateVehicleType
);

router.delete('/:id', [param('id').isUUID(), query('confirm').equals('true')], validate, controller.deleteVehicleType);

module.exports = router;
