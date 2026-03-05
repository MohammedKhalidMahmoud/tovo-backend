const router = require('express').Router();
const { body, query, param } = require('express-validator');
const controller = require('./trips.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const userOnly    = [authenticate, authorize('user')];
const captainOnly = [authenticate, authorize('captain')];
const bothRoles   = [authenticate, authorize('user', 'captain')];

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/regions/active', controller.getActiveRegions);

// ── Fare Estimate ─────────────────────────────────────────────────────────────
router.get('/estimate', ...bothRoles, [
  query('trip_id').isUUID().withMessage('trip_id must be a valid UUID'),
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
  body('payment_type').isIn(['cash', 'card']).withMessage('payment_type must be cash or card'),
  body('payment_method_id')
    .if(body('payment_type').equals('card'))
    .notEmpty().isUUID().withMessage('payment_method_id is required when payment_type is card'),
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

// ── Captain: Trip Lifecycle ───────────────────────────────────────────────────
router.patch('/:id/accept',  ...captainOnly, [param('id').isUUID()], validate, controller.acceptTrip);
router.patch('/:id/decline', ...captainOnly, [param('id').isUUID()], validate, controller.declineTrip);
router.patch('/:id/start',   ...captainOnly, [param('id').isUUID()], validate, controller.startTrip);
router.patch('/:id/end',     ...captainOnly, [param('id').isUUID()], validate, controller.endTrip);

module.exports = router;
