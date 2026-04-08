const router = require('express').Router();
const { param } = require('express-validator');
const controller = require('./faqs.controller');
const validate = require('../../middleware/validate.middleware');

router.get('/', controller.listActiveFaqs);
router.get('/:id', [param('id').isUUID()], validate, controller.getActiveFaq);

module.exports = router;
