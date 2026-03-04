const router = require('express').Router();
const { body } = require('express-validator');
const settingsController = require('./settings.controller');
const validate = require('../../middleware/validate.middleware');

router.get('/', settingsController.getSettings);

router.put(
  '/',
  [
    body('currency').optional().isString(),
    body('defaultLanguage').optional().isString(),
    body('notificationSettings').optional().isObject(),
  ],
  validate,
  settingsController.updateSettings
);

module.exports = router;