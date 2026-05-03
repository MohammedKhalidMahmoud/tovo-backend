const router = require('express').Router();
const { body, param, query } = require('express-validator');
const controller = require('./instructions.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');

const adminRead = [authenticate, requirePermission('instructions:read')];
const adminManage = [authenticate, requirePermission('instructions:manage')];

const serviceIdsValidator = [
  body('serviceIds').optional().isArray().withMessage('serviceIds must be an array'),
  body('serviceIds.*').optional().isUUID().withMessage('Each serviceId must be a valid UUID'),
];

router.get(
  '/',
  ...adminRead,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('isActive').optional().isBoolean(),
    query('search').optional().trim(),
    query('serviceId').optional().isUUID(),
  ],
  validate,
  controller.listInstructions
);

router.get(
  '/service/:serviceId',
  ...adminRead,
  [param('serviceId').isUUID()],
  validate,
  controller.listActiveInstructionsByService
);

router.post(
  '/',
  ...adminManage,
  [
    body('title').trim().notEmpty().withMessage('title is required'),
    body('description').trim().notEmpty().withMessage('description is required'),
    body('order').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
    ...serviceIdsValidator,
  ],
  validate,
  controller.createInstruction
);

router.get('/:id', ...adminRead, [param('id').isUUID()], validate, controller.getInstruction);

router.put(
  '/:id',
  ...adminManage,
  [
    param('id').isUUID(),
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('order').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
    ...serviceIdsValidator,
  ],
  validate,
  controller.updateInstruction
);

router.patch(
  '/:id',
  ...adminManage,
  [
    param('id').isUUID(),
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('order').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
    ...serviceIdsValidator,
  ],
  validate,
  controller.updateInstruction
);

router.delete('/:id', ...adminManage, [param('id').isUUID()], validate, controller.deleteInstruction);

router.get(
  '/:id/services',
  ...adminRead,
  [param('id').isUUID()],
  validate,
  controller.getInstructionServices
);

router.post(
  '/:id/services',
  ...adminManage,
  [param('id').isUUID(), body('serviceId').isUUID()],
  validate,
  controller.linkInstructionService
);

router.delete(
  '/:id/services/:serviceId',
  ...adminManage,
  [param('id').isUUID(), param('serviceId').isUUID()],
  validate,
  controller.unlinkInstructionService
);

module.exports = router;
