const router   = require('express').Router();
const { body, param } = require('express-validator');
const ctrl     = require('./services.admin.controller');
const validate = require('../../middleware/validate.middleware');

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
