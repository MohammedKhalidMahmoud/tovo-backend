const router = require('express').Router();
const { body, param, query } = require('express-validator');
const ctrl = require('./tollGates.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const adminOnly = [authenticate, authorize('admin')];

router.get(
  '/',
  ...adminOnly,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be greater than 0'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  ],
  validate,
  ctrl.listTollGates,
);

router.get('/:id', ...adminOnly, [param('id').isUUID()], validate, ctrl.getTollGate);

router.post(
  '/',
  ...adminOnly,
  [
    body('name').trim().isLength({ min: 1 }).withMessage('name is required'),
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('lng must be between -180 and 180'),
    body('fee').isDecimal({ decimal_digits: '0,2' }).withMessage('fee must be a valid decimal with up to 2 places'),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  ctrl.createTollGate,
);

router.put(
  '/:id',
  ...adminOnly,
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1 }).withMessage('name must not be empty'),
    body('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90'),
    body('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('lng must be between -180 and 180'),
    body('fee').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('fee must be a valid decimal with up to 2 places'),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  ctrl.updateTollGate,
);

router.delete(
  '/:id',
  ...adminOnly,
  [
    param('id').isUUID(),
    query('confirm').equals('true').withMessage('confirm=true is required'),
  ],
  validate,
  ctrl.deleteTollGate,
);

module.exports = router;
