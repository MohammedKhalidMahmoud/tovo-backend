// ════════════════════════════════════════════════════════════════════════════════
// SOS - Admin Routes
// Path: src/modules/admin/sos/sos.routes.js
// ════════════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const sosController   = require('./sos.controller');

router.get('/',             sosController.listAlerts);
router.get('/:id',          sosController.getAlert);
router.post('/:id/handle',  sosController.handleAlert);

module.exports = router;
