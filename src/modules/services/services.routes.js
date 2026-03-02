// ════════════════════════════════════════════════════════════════════════════════
// Services - Public Routes
// Path: src/modules/services/services.routes.js
// Mounted at: /api/v1/services
// ════════════════════════════════════════════════════════════════════════════════

const router  = require('express').Router();
const { success } = require('../../utils/response');
const svcService  = require('./services.service');

// GET /services — no auth required, used by the app to display service options
router.get('/', async (req, res, next) => {
  try {
    const services = await svcService.listActiveServices();
    return success(res, services, 'Services retrieved successfully');
  } catch (err) { next(err); }
});

module.exports = router;
