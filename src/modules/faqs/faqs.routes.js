// ════════════════════════════════════════════════════════════════════════════════
// FAQs - Public Routes
// Path: src/modules/faqs/faqs.routes.js
// ════════════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const ctrl   = require('./faqs.controller');

router.get('/', ctrl.listFaqs);

module.exports = router;
