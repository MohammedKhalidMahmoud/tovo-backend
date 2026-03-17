const router   = require('express').Router();
const { param } = require('express-validator');
const validate  = require('../../middleware/validate.middleware');
const ctrl      = require('./regions.controller');

router.get('/',    ctrl.listActiveRegions);
router.get('/:id', [param('id').isUUID()], validate, ctrl.getActiveRegion);

module.exports = router;
