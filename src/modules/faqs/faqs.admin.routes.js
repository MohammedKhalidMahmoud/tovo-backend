const router   = require('express').Router();
const { body, param, query } = require('express-validator');
const ctrl     = require('./faqs.controller');
const validate = require('../../middleware/validate.middleware');

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('isActive').optional().isBoolean(),
], validate, ctrl.listFaqs);

router.post('/', [
  body('question').trim().notEmpty().withMessage('question is required'),
  body('answer').trim().notEmpty().withMessage('answer is required'),
  body('order').optional().isInt({ min: 0 }),
], validate, ctrl.createFaq);

router.get('/:id', [param('id').isUUID()], validate, ctrl.getFaq);

router.put('/:id', [
  param('id').isUUID(),
  body('question').optional().trim().notEmpty(),
  body('answer').optional().trim().notEmpty(),
  body('order').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean(),
], validate, ctrl.updateFaq);

router.delete('/:id', [param('id').isUUID()], validate, ctrl.deleteFaq);

module.exports = router;
