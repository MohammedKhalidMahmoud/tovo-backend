const router   = require('express').Router();
const { body, param, query } = require('express-validator');
const ctrl     = require('./vehicleModels.controller');
const validate = require('../../middleware/validate.middleware');

router.get('/', ctrl.listModels);

router.get('/:id', [param('id').isUUID()], validate, ctrl.getModel);

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 1 }).withMessage('name is required'),
    body('brand').trim().isLength({ min: 1 }).withMessage('brand is required'),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  ctrl.createModel,
);

router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1 }),
    body('brand').optional().trim().isLength({ min: 1 }),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  ctrl.updateModel,
);

router.delete(
  '/:id',
  [param('id').isUUID(), query('confirm').equals('true').withMessage('confirm=true is required')],
  validate,
  ctrl.deleteModel,
);

module.exports = router;
