const router = require('express').Router();
const { body, param } = require('express-validator');
const controller = require('./vehicles.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');

router.get('/', authenticate, controller.getAll);

router.get('/:id', authenticate, [
  param('id').isUUID().withMessage('id must be a valid UUID'),
], validate, controller.getById);

router.post('/', authenticate, [
  body('name').notEmpty().withMessage('name is required').trim(),
  body('description').optional().isString().trim(),
  body('imageUrl').optional().isURL().withMessage('imageUrl must be a valid URL'),
], validate, controller.addNewType);

module.exports = router;
