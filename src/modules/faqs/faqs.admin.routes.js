const router = require('express').Router();
const { body, param, query } = require('express-validator');
const controller = require('./faqs.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');

const adminRead = [authenticate, requirePermission('faqs:read')];
const adminManage = [authenticate, requirePermission('faqs:manage')];

router.get(
  '/',
  ...adminRead,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('isActive').optional().isBoolean(),
    query('search').optional().trim(),
  ],
  validate,
  controller.listFaqs
);

router.post(
  '/',
  ...adminManage,
  [
    body('question').trim().notEmpty().withMessage('question is required'),
    body('answer').trim().notEmpty().withMessage('answer is required'),
    body('order').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  controller.createFaq
);

router.get('/:id', ...adminRead, [param('id').isUUID()], validate, controller.getFaq);

router.put(
  '/:id',
  ...adminManage,
  [
    param('id').isUUID(),
    body('question').optional().trim().notEmpty(),
    body('answer').optional().trim().notEmpty(),
    body('order').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  controller.updateFaq
);

router.delete('/:id', ...adminManage, [param('id').isUUID()], validate, controller.deleteFaq);

module.exports = router;
