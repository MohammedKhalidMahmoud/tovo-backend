const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl = require('./settings.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/', ctrl.getPublicSettings);

module.exports = router;
