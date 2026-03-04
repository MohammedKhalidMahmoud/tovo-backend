const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('./support.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');

router.post('/',             authenticate, [body('subject').notEmpty()], validate, controller.createTicket);
router.get('/',              authenticate, controller.getTickets);
router.get('/:id',           authenticate, controller.getTicketById);
router.post('/:id/messages', authenticate, [body('body').notEmpty()], validate, controller.addMessage);

module.exports = router;
