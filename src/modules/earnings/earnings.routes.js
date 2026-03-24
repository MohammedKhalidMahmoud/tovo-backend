const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const ctrl = require('./earnings.controller');

router.use(authenticate, authorize('admin'));

// GET /
router.get('/', ctrl.listEarnings);

module.exports = router;
