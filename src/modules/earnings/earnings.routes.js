const router = require('express').Router();
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');
const ctrl = require('./earnings.controller');

router.use(authenticate, requirePermission('reports:read'));

// GET /
router.get('/', ctrl.listEarnings);

module.exports = router;
