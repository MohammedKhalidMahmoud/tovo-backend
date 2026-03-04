const router = require('express').Router();
const { body, param, query } = require('express-validator');
const controller = require('./admins.controller');
const validate = require('../../middleware/validate.middleware');

router.get('/', controller.listAdmins);

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 1 }),
    body('email').isEmail(),
    body('role').isString(),
    body('password').isLength({ min: 8 }),
  ],
  validate,
  controller.createAdmin
);

router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1 }),
    body('role').optional().isString(),
    body('status').optional().isString(),
  ],
  validate,
  controller.updateAdmin
);

router.delete(
  '/:id',
  [param('id').isUUID(), query('confirm').equals('true')],
  validate,
  controller.deleteAdmin
);

module.exports = router;