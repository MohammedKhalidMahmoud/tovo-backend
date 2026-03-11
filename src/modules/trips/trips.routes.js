const router = require('express').Router();
const { body, query, param } = require('express-validator');
const controller = require('./trips.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const userOnly    = [authenticate, authorize('customer')];
const captainOnly = [authenticate, authorize('driver')];
const bothRoles   = [authenticate, authorize('customer', 'driver')];

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/regions/active', controller.getActiveRegions);

// ── Fare Estimate ─────────────────────────────────────────────────────────────
router.get('/estimate', [
  query('lat_pick').isFloat().withMessage('lat_pick must be a valid float'),
  query('lng_pick').isFloat().withMessage('lng_pick must be a valid float'),
  query('lat_drop').isFloat().withMessage('lat_drop must be a valid float'),
  query('lng_drop').isFloat().withMessage('lng_drop must be a valid float'),
], validate, controller.estimateFare);

// ── User: Create & List Trips ─────────────────────────────────────────────────
router.post('/', ...userOnly, [
  body('pickup_lat').isFloat(),
  body('pickup_lng').isFloat(),
  body('pickup_address').notEmpty(),
  body('dropoff_lat').isFloat(),
  body('dropoff_lng').isFloat(),
  body('dropoff_address').notEmpty(),
  body('service_id').notEmpty().isUUID().withMessage('service_id is required and must be a valid UUID'),
  body('payment_type').isIn(['cash', 'instapay']).withMessage('payment_type must be cash or instapay'),
], validate, controller.createTrip);

router.get('/', ...userOnly, controller.getUserTrips);

// ── Nearby Captains (must be before /:id) ────────────────────────────────────
router.get('/nearby-captains', authenticate, [
  query('latitude').isFloat().withMessage('latitude is required and must be a float'),
  query('longitude').isFloat().withMessage('longitude is required and must be a float'),
  query('radius').optional().isFloat({ min: 0 }).withMessage('radius must be a positive number'),
  query('serviceId').optional().isUUID().withMessage('serviceId must be a valid UUID'),
], validate, controller.getNearbyCaptains);

// ── Captain: Browse & History (must be before /:id) ──────────────────────────
router.get('/captain/requests', ...captainOnly, controller.getNewRequests);
router.get('/captain/trips',    ...captainOnly, controller.getCaptainTrips);

// ── Captain Ratings (must be before /:id) ────────────────────────────────────
router.get('/captains/:captainId/ratings', authenticate, [
  param('captainId').isUUID().withMessage('captainId must be a valid UUID'),
], validate, controller.getCaptainRatings);

router.get('/:id',          ...bothRoles,   [param('id').isUUID()], validate, controller.getTripById);
router.patch('/:id/cancel', ...userOnly,    [param('id').isUUID()], validate, controller.cancelTrip);

// ── User: Rate a trip ─────────────────────────────────────────────────────────
router.post('/:id/rating', ...userOnly, [
  param('id').isUUID(),
  body('rating').isInt({ min: 1, max: 5 }),
], validate, controller.rateTrip);

module.exports = router;
