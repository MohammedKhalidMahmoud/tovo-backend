const router = require('express').Router();
const { param, query } = require('express-validator');
const controller = require('./instructions.controller');
const validate = require('../../middleware/validate.middleware');

router.get(
  '/',
  [query('serviceId').optional().isUUID()],
  validate,
  controller.listActiveInstructions
);

router.get(
  '/service/:serviceId',
  [param('serviceId').isUUID()],
  validate,
  controller.listActiveInstructionsByService
);

router.get('/:id', [param('id').isUUID()], validate, controller.getActiveInstruction);

module.exports = router;
