const router   = require('express').Router();
const { body, param } = require('express-validator');
const ctrl     = require('./vehicles.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize, requirePermission } = require('../../middleware/auth.middleware');

router.get('/me', authenticate, authorize('driver'), ctrl.getMyVehicle);

router.get('/', authenticate, requirePermission('fleets:read'), ctrl.listVehicles);

router.post(
  '/',
  authenticate, requirePermission('fleets:manage'),
  [
    body('driverId').isUUID().withMessage('driverId must be a valid UUID'),
    body('vehicleModelId').optional().isUUID().withMessage('vehicleModelId must be a valid UUID'),
    body('vin').trim().isLength({ min: 1 }).withMessage('vin is required'),
  ],
  validate,
  ctrl.createVehicle
);

router.get('/:id', authenticate, requirePermission('fleets:read'), [param('id').isUUID()], validate, ctrl.getVehicle);

router.put(
  '/:id',
  authenticate, requirePermission('fleets:manage'),
  [
    param('id').isUUID(),
    body('vehicleModelId').optional().isUUID().withMessage('vehicleModelId must be a valid UUID'),
    body('vin').optional().trim().isLength({ min: 1 }).withMessage('vin must not be empty'),
  ],
  validate,
  ctrl.updateVehicle
);

router.delete('/:id', authenticate, requirePermission('fleets:manage'), [param('id').isUUID()], validate, ctrl.deleteVehicle);

module.exports = router;
