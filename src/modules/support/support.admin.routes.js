const router  = require('express').Router();
const { body, param, query } = require('express-validator');
const ctrl    = require('./support.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');

const adminRead = [authenticate, requirePermission('complaints:read')];
const adminManage = [authenticate, requirePermission('complaints:manage')];

router.get(
  '/',
  ...adminRead,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isString(),
    query('type').optional().isString(),
    query('search').optional().isString(),
  ],
  validate,
  ctrl.listComplaints,
);

router.get('/:id', ...adminRead, [param('id').isUUID()], validate, ctrl.getComplaint);

router.post(
  '/:id/respond',
  ...adminManage,
  [param('id').isUUID(), body('response').notEmpty().withMessage('response is required')],
  validate,
  ctrl.respondToComplaint,
);

router.patch('/:id/resolve', ...adminManage, [param('id').isUUID()], validate, ctrl.resolveComplaint);

module.exports = router;
