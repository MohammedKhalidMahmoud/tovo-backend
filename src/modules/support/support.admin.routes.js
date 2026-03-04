const router = require('express').Router();
const { body, query, param } = require('express-validator');
const ctrl     = require('./support.admin.controller');
const validate = require('../../middleware/validate.middleware');

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['all', 'pending', 'resolved']),
  query('type').optional().isIn(['user', 'driver']),
  query('search').optional().trim(),
], validate, ctrl.listComplaints);

router.get('/:id', [param('id').isUUID()], validate, ctrl.getComplaint);

router.post('/:id/respond', [
  param('id').isUUID(),
  body('response').trim().isLength({ min: 1 }),
], validate, ctrl.respond);

router.post('/:id/resolve', [param('id').isUUID()], validate, ctrl.resolve);

module.exports = router;
