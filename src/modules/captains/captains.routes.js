const router = require('express').Router();
const { body, param } = require('express-validator');
const multer = require('multer');
const controller = require('./captains.controller');
const tripsController = require('../trips/trips.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const upload = multer({ dest: 'uploads/' });
const captainOnly = [authenticate, authorize('captain')];

// ── Profile ───────────────────────────────────────────────────────────────────
router.get('/me',                          ...captainOnly, controller.getProfile);
router.put('/me',                          ...captainOnly, [
  body('name').optional().notEmpty().trim(),
  body('phone').optional().notEmpty().trim(),
  body('language').optional().isIn(['en', 'ar']).withMessage('language must be en or ar'),
  body('notificationsEnabled').optional().isBoolean(),
], validate, controller.updateProfile);
router.patch('/me/avatar',                 ...captainOnly, upload.single('avatar'), controller.updateAvatar);
router.post('/me/duty/start',              ...captainOnly, controller.startDuty);
router.post('/me/duty/end',                ...captainOnly, controller.endDuty);
router.get('/me/wallet',                   ...captainOnly, controller.getWallet);

// ── Price Plans ───────────────────────────────────────────────────────────────
router.get('/me/price-plans',              ...captainOnly, controller.getPricePlans);
router.post('/me/price-plans',             ...captainOnly, [body('plan_id').notEmpty().isUUID()], validate, controller.subscribeToPlan);

// ── Insurance ─────────────────────────────────────────────────────────────────
router.get('/me/insurance',                ...captainOnly, controller.getInsuranceCards);

// ── Trip Management (Captain side) ────────────────────────────────────────────
router.get('/me/trips',                    ...captainOnly, tripsController.getCaptainTrips);
router.patch('/me/trips/:id/accept',       ...captainOnly, [param('id').isUUID()], validate, tripsController.acceptTrip);
router.patch('/me/trips/:id/decline',      ...captainOnly, [param('id').isUUID()], validate, tripsController.declineTrip);
router.patch('/me/trips/:id/start',        ...captainOnly, [param('id').isUUID()], validate, tripsController.startTrip);
router.patch('/me/trips/:id/end',          ...captainOnly, [param('id').isUUID()], validate, tripsController.endTrip);
router.post('/me/trips/:id/fare-offer',    ...captainOnly, [
  param('id').isUUID(),
  body('proposed_fare').isDecimal(),
  body('currency').notEmpty(),
], validate, tripsController.createFareOffer);

module.exports = router;
