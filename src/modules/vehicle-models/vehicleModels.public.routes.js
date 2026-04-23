// ════════════════════════════════════════════════════════════════════════════════
// Vehicle Models - Public Routes
// Mounted at: /api/v1/vehicle-models
// ════════════════════════════════════════════════════════════════════════════════

const router   = require('express').Router();
const { param } = require('express-validator');
const validate  = require('../../middleware/validate.middleware');
const ctrl      = require('./vehicleModels.controller');

router.get('/',    ctrl.listActiveModels);
router.get('/:id', [param('id').isUUID()], validate, ctrl.getActiveModel);
router.get('/:id/services', [param('id').isUUID()], validate, ctrl.getModelServices);

module.exports = router;
