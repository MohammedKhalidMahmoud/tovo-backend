const router = require('express').Router();
const { body, query, param } = require('express-validator');
const supportController = require('./support.controller');
const validate = require('../../../middleware/validate.middleware');

router.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['all', 'pending', 'resolved']),
    query('type').optional().isIn(['user', 'driver']),
    query('search').optional().trim(),
  ],
  validate,
  supportController.listComplaints
);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('id must be UUID')],
  validate,
  supportController.getComplaint
);

router.post(
  '/:id/respond',
  [
    param('id').isUUID(),
    body('response').trim().isLength({ min: 1 }),
  ],
  validate,
  supportController.respond
);

router.post(
  '/:id/resolve',
  [param('id').isUUID()],
  validate,
  supportController.resolve
);

module.exports = router;