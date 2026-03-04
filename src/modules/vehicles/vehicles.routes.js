const router   = require('express').Router();
const { body, param } = require('express-validator');
const ctrl     = require('./vehicles.controller');
const validate = require('../../middleware/validate.middleware');

router.get('/', ctrl.listVehicles);

router.post(
  '/',
  [
    body('captainId').isUUID().withMessage('captainId must be a valid UUID'),
    body('vehicleModelId').optional().isUUID().withMessage('vehicleModelId must be a valid UUID'),
    body('vin').trim().isLength({ min: 1 }).withMessage('vin is required'),
  ],
  validate,
  ctrl.createVehicle
);

router.get('/:id',  [param('id').isUUID()], validate, ctrl.getVehicle);

router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('vehicleModelId').optional().isUUID().withMessage('vehicleModelId must be a valid UUID'),
    body('vin').optional().trim().isLength({ min: 1 }).withMessage('vin must not be empty'),
  ],
  validate,
  ctrl.updateVehicle
);

router.delete('/:id', [param('id').isUUID()], validate, ctrl.deleteVehicle);

module.exports = router;
