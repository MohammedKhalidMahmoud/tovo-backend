const router   = require('express').Router();
const { param } = require('express-validator');
const validate = require('../../middleware/validate.middleware');
const ctrl     = require('./services.controller');

router.get('/', ctrl.listActiveServices);
router.get('/:id', [param('id').isUUID()], validate, ctrl.getActiveService);

module.exports = router;
