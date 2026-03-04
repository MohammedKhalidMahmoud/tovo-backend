// ════════════════════════════════════════════════════════════════════════════════
// SOS - User/Captain Routes
// Path: src/modules/sos/sos.routes.js
// ════════════════════════════════════════════════════════════════════════════════

const router     = require('express').Router();
const ctrl       = require('./sos.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.post('/', authenticate, ctrl.triggerSos);

module.exports 
= router;
