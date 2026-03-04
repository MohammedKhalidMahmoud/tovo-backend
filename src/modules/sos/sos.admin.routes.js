const router        = require('express').Router();
const sosController = require('./sos.admin.controller');

router.get('/',            sosController.listAlerts);
router.get('/:id',         sosController.getAlert);
router.post('/:id/handle', sosController.handleAlert);

module.exports = router;
