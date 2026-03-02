// ════════════════════════════════════════════════════════════════════════════════
// Vehicles (Fleet) - Admin Routes
// Path: src/modules/admin/vehicles/fleet.routes.js
// Mounted at: /api/v1/admin/vehicles
// ════════════════════════════════════════════════════════════════════════════════

const router   = require('express').Router();
const { body, param } = require('express-validator');
const fleetController     = require('./fleet.controller');
const validate = require('../../../middleware/validate.middleware');

router.get('/', fleetController.listVehicles);

router.post(
  '/',
  [
    body('captainId').isUUID().withMessage('captainId must be a valid UUID'),
    body('typeId').isUUID().withMessage('typeId must be a valid UUID'),
    body('vin').trim().isLength({ min: 1 }).withMessage('vin is required'),
  ],
  validate,
  fleetController.createVehicle
);

router.get('/:id',    [param('id').isUUID()], validate, fleetController.getVehicle);

router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('typeId').optional().isUUID().withMessage('typeId must be a valid UUID'),
    body('vin').optional().trim().isLength({ min: 1 }).withMessage('vin must not be empty'),
  ],
  validate,
  fleetController.updateVehicle
);

router.delete('/:id', [param('id').isUUID()], validate, fleetController.deleteVehicle);

module.exports = router;
