const router = require('express').Router();
const ctrl   = require('./faqs.controller');

// GET /api/v1/faqs — list active FAQs (public)
router.get('/', (req, res, next) => {
  req.query.isActive = 'true';
  return ctrl.listFaqs(req, res, next);
});

module.exports = router;
