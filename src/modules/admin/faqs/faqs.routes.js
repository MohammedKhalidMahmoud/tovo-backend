// ════════════════════════════════════════════════════════════════════════════════
// FAQs - Admin Routes
// Path: src/modules/admin/faqs/faqs.routes.js
// ════════════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const ctrl   = require('./faqs.controller');

router.get('/',    ctrl.listFaqs);
router.post('/',   ctrl.createFaq);
router.get('/:id', ctrl.getFaq);
router.put('/:id', ctrl.updateFaq);
router.delete('/:id', ctrl.deleteFaq);

module.exports = router;
