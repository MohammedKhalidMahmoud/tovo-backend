const router = require('express').Router();
const { body, query } = require('express-validator');
const controller = require('./locations.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');

router.get('/search', authenticate, [
  query('q').notEmpty().withMessage('Search query is required').trim(),
  query('lat').optional().isFloat().withMessage('lat must be a float'),
  query('lng').optional().isFloat().withMessage('lng must be a float'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50'),
], validate, controller.search);

router.post('/reverse-geocode', authenticate, [
  body('lat').isFloat().withMessage('lat must be a float'),
  body('lng').isFloat().withMessage('lng must be a float'),
], validate, controller.reverseGeocode);

router.get('/nearby-captains', authenticate, [
  query('lat').isFloat().withMessage('lat is required and must be a float'),
  query('lng').isFloat().withMessage('lng is required and must be a float'),
  query('vehicle_type_id').optional().isUUID().withMessage('vehicle_type_id must be a valid UUID'),
  query('radius_km').optional().isFloat({ min: 0 }).withMessage('radius_km must be a positive number'),
], validate, controller.getNearbyCaptains);

module.exports = router;
