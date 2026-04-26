const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const ctrl = require('./commission-rules.controller');

const VALID_TYPES = ['fixed_amount', 'percentage', 'tiered_fixed', 'tiered_percentage'];

router.use(authenticate);

// GET /
router.get('/', requirePermission('commission-rules:read'), ctrl.list);

// GET /:id
router.get('/:id', requirePermission('commission-rules:read'), ctrl.getOne);

// POST /
router.post(
  '/',
  requirePermission('commission-rules:manage'),
  [
    body('name').notEmpty().withMessage('name is required'),
    body('type').isIn(VALID_TYPES).withMessage(`type must be one of: ${VALID_TYPES.join(', ')}`),
    body('config').notEmpty().withMessage('config is required'),
  ],
  validate,
  ctrl.create
);

// PATCH /:id
router.patch(
  '/:id',
  requirePermission('commission-rules:manage'),
  [
    body('name').optional().notEmpty().withMessage('name must not be empty'),
    body('type').optional().isIn(VALID_TYPES).withMessage(`type must be one of: ${VALID_TYPES.join(', ')}`),
    body('config').optional().notEmpty().withMessage('config must not be empty'),
  ],
  validate,
  ctrl.update
);

// PATCH /:id/activate
router.patch('/:id/activate', requirePermission('commission-rules:manage'), ctrl.activate);

// DELETE /:id
router.delete('/:id', requirePermission('commission-rules:manage'), ctrl.remove);

module.exports = router;
