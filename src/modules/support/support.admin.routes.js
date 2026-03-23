const router  = require('express').Router();
const { body, param, query } = require('express-validator');
const ctrl    = require('./support.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const adminOnly = [authenticate, authorize('admin')];

router.get(
  '/',
  ...adminOnly,
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

router.get('/:id', ...adminOnly, [param('id').isUUID()], validate, ctrl.getComplaint);

router.post(
  '/:id/respond',
  ...adminOnly,
  [param('id').isUUID(), body('response').notEmpty().withMessage('response is required')],
  validate,
  ctrl.respondToComplaint,
);

router.patch('/:id/resolve', ...adminOnly, [param('id').isUUID()], validate, ctrl.resolveComplaint);

module.exports = router;
