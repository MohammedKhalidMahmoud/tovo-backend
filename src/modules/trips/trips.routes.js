const router = require('express').Router();
const { body, query, param } = require('express-validator');
const controller = require('./trips.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const userOnly    = [authenticate, authorize('user')];
const captainOnly = [authenticate, authorize('captain')];
const bothRoles   = [authenticate, authorize('user', 'captain')];

// ── Fare Estimate ─────────────────────────────────────────────────────────────
router.get('/estimate', ...userOnly, [
  query('pickup_lat').isFloat(),
  query('pickup_lng').isFloat(),
  query('dropoff_lat').isFloat(),
  query('dropoff_lng').isFloat(),
  query('service_id').optional().isUUID().withMessage('service_id must be a valid UUID'),
], validate, controller.estimateFare);

// ── User: Create & List Trips ─────────────────────────────────────────────────
router.post('/', ...userOnly, [
  body('pickup_lat').isFloat(),
  body('pickup_lng').isFloat(),
  body('pickup_address').notEmpty(),
  body('dropoff_lat').isFloat(),
  body('dropoff_lng').isFloat(),
  body('dropoff_address').notEmpty(),
  body('payment_method_id').notEmpty().isUUID(),
  body('service_id').notEmpty().isUUID().withMessage('service_id is required and must be a valid UUID'),
], validate, controller.createTrip);

router.get('/',           ...userOnly,    controller.getUserTrips);
router.get('/:id',        ...bothRoles,   [param('id').isUUID()], validate, controller.getTripById);
router.patch('/:id/cancel', ...userOnly, [param('id').isUUID()], validate, controller.cancelTrip);

// ── User: Rate a trip ─────────────────────────────────────────────────────────
router.post('/:id/rating', ...userOnly, [
  param('id').isUUID(),
  body('rating').isInt({ min: 1, max: 5 }),
], validate, controller.rateTrip);

// ── Captain: Browse & History ─────────────────────────────────────────────────
router.get('/captain/requests', ...captainOnly, controller.getNewRequests);
router.get('/captain/trips',    ...captainOnly, controller.getCaptainTrips);

// ── Captain: Trip Lifecycle ───────────────────────────────────────────────────
router.patch('/:id/accept',  ...captainOnly, [param('id').isUUID()], validate, controller.acceptTrip);
router.patch('/:id/decline', ...captainOnly, [param('id').isUUID()], validate, controller.declineTrip);
router.patch('/:id/start',   ...captainOnly, [param('id').isUUID()], validate, controller.startTrip);
router.patch('/:id/end',     ...captainOnly, [param('id').isUUID()], validate, controller.endTrip);

// ── Captain: Fare Offers ──────────────────────────────────────────────────────
router.post('/:id/fare-offer', ...captainOnly, [
  param('id').isUUID(),
  body('proposed_fare').isFloat({ min: 0 }),
  body('currency').optional().isString(),
], validate, controller.createFareOffer);

// ── Captain Ratings (public-ish) ──────────────────────────────────────────────
router.get('/captains/:captainId/ratings', authenticate, [
  param('captainId').isUUID().withMessage('captainId must be a valid UUID'),
], validate, controller.getCaptainRatings);

module.exports = router;
