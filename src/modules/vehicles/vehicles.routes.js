const router   = require('express').Router();
const { body, param } = require('express-validator');
const ctrl     = require('./vehicles.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

router.get('/me', authenticate, authorize('driver'), ctrl.getMyVehicle);

router.get('/', authenticate, authorize('admin'), ctrl.listVehicles);

router.post(
  '/',
  authenticate, authorize('admin'),
  [
    body('captainId').isUUID().withMessage('captainId must be a valid UUID'),
    body('vehicleModelId').optional().isUUID().withMessage('vehicleModelId must be a valid UUID'),
    body('vin').trim().isLength({ min: 1 }).withMessage('vin is required'),
  ],
  validate,
  ctrl.createVehicle
);

router.get('/:id', authenticate, authorize('admin'), [param('id').isUUID()], validate, ctrl.getVehicle);

router.put(
  '/:id',
  authenticate, authorize('admin'),
  [
    param('id').isUUID(),
    body('vehicleModelId').optional().isUUID().withMessage('vehicleModelId must be a valid UUID'),
    body('vin').optional().trim().isLength({ min: 1 }).withMessage('vin must not be empty'),
  ],
  validate,
  ctrl.updateVehicle
);

router.delete('/:id', authenticate, authorize('admin'), [param('id').isUUID()], validate, ctrl.deleteVehicle);

module.exports = router;
