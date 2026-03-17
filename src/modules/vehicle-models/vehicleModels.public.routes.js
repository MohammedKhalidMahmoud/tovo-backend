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

module.exports = router;
