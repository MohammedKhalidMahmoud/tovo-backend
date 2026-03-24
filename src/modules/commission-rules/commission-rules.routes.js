const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const ctrl = require('./commission-rules.controller');

const VALID_TYPES = ['fixed_amount', 'percentage', 'tiered_fixed', 'tiered_percentage'];

router.use(authenticate, authorize('admin'));

// GET /
router.get('/', ctrl.list);

// GET /:id
router.get('/:id', ctrl.getOne);

// POST /
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('name is required'),
    body('type').isIn(VALID_TYPES).withMessage(`type must be one of: ${VALID_TYPES.join(', ')}`),
    body('serviceId').optional({ nullable: true }).isUUID().withMessage('serviceId must be a valid UUID'),
    body('config').notEmpty().withMessage('config is required'),
  ],
  validate,
  ctrl.create
);

// PATCH /:id
router.patch(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('name must not be empty'),
    body('type').optional().isIn(VALID_TYPES).withMessage(`type must be one of: ${VALID_TYPES.join(', ')}`),
    body('serviceId').optional({ nullable: true }).isUUID().withMessage('serviceId must be a valid UUID'),
    body('config').optional().notEmpty().withMessage('config must not be empty'),
  ],
  validate,
  ctrl.update
);

// PATCH /:id/activate
router.patch('/:id/activate', ctrl.activate);

// DELETE /:id
router.delete('/:id', ctrl.remove);

module.exports = router;
