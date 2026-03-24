const router = require('express').Router();
const { body, param, query } = require('express-validator');
const validate = require('../../middleware/validate.middleware');
const controller = require('./complaints.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

router.use(authenticate, authorize('admin'));

// GET /admin/complaints - List all complaints
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']),
  ],
  validate,
  controller.listComplaints
);

// GET /admin/complaints/:id - Get complaint details
router.get(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid complaint ID'),
  ],
  validate,
  controller.getComplaintDetails
);

// POST /admin/complaints/:id/respond - Admin reply to complaint
router.post(
  '/:id/respond',
  [
    param('id').isUUID().withMessage('Invalid complaint ID'),
    body('response').trim().notEmpty().withMessage('Response message is required'),
  ],
  validate,
  controller.respondToComplaint
);

// PATCH /admin/complaints/:id - Update complaint status
router.patch(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid complaint ID'),
    body('status')
      .isIn(['open', 'in_progress', 'resolved', 'closed'])
      .withMessage('Status must be one of: open, in_progress, resolved, closed'),
  ],
  validate,
  controller.updateComplaintStatus
);

// POST /admin/complaints/:id/resolve - Mark complaint resolved
router.post(
  '/:id/resolve',
  [
    param('id').isUUID().withMessage('Invalid complaint ID'),
  ],
  validate,
  (req, res, next) => {
    req.body.status = 'resolved';
    return controller.updateComplaintStatus(req, res, next);
  }
);

// DELETE /admin/complaints/:id - Delete complaint
router.delete(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid complaint ID'),
  ],
  validate,
  controller.deleteComplaint
);

module.exports = router;
