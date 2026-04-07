const router = require('express').Router();
const { body, param, query } = require('express-validator');
const multer = require('multer');
const path   = require('path');
const driverController      = require('./drivers.controller');
// const driverController = require('./drivers.admin.driverController');
const tripsController = require('../trips/trips.controller');
const walletsController = require('../wallets/wallets.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });
const driverOnly = [authenticate, authorize('driver')];

// ── Profile ───────────────────────────────────────────────────────────────────
router.get('/me',                          ...driverOnly, driverController.getProfile);
router.put('/me',                          ...driverOnly, [
  body('name').optional().notEmpty().trim(),
  body('phone').optional().notEmpty().trim(),
  body('language').optional().isIn(['en', 'ar']).withMessage('language must be en or ar'),
  body('notificationsEnabled').optional().isBoolean(),
], validate, driverController.updateProfile);
router.patch('/me/avatar',                 ...driverOnly, upload.single('avatar'), driverController.updateAvatar);
router.post('/me/duty/start',              ...driverOnly, driverController.startDuty);
router.post('/me/duty/end',                ...driverOnly, driverController.endDuty);
router.get('/me/wallet',                   ...driverOnly, driverController.getWallet);

// ── Insurance ─────────────────────────────────────────────────────────────────
router.get('/me/insurance',                ...driverOnly, driverController.getInsuranceCards);

// ── Trip Management (Driver side) ────────────────────────────────────────────
router.get('/me/trips',                    ...driverOnly, tripsController.getDriverTrips);
router.patch('/me/trips/:id/accept',       ...driverOnly, [param('id').isUUID()], validate, tripsController.acceptTrip);
router.patch('/me/trips/:id/decline',      ...driverOnly, [param('id').isUUID()], validate, tripsController.declineTrip);
router.patch('/me/trips/:id/start',        ...driverOnly, [param('id').isUUID()], validate, tripsController.startTrip);
router.patch('/me/trips/:id/end',          ...driverOnly, [param('id').isUUID()], validate, tripsController.endTrip);
router.patch('/me/trips/:id/stops/:stopId/arrive', ...driverOnly, [
  param('id').isUUID(),
  param('stopId').isUUID(),
], validate, tripsController.markStopArrived);
router.post('/me/trips/:tripId/credit-customer', ...driverOnly, [
  param('tripId').isUUID().withMessage('tripId must be a valid UUID'),
  body('amount').isFloat({ gt: 0 }).withMessage('amount must be a positive number'),
], validate, walletsController.driverCreditCustomer);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be > 0'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1-100'),
    query('sortBy').optional().isIn(['createdAt', 'rating', 'totalTrips', 'totalEarnings']),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    query('search').optional().trim().isLength({ min: 1, max: 100 }),
    query('status').optional().isIn(['all', 'active', 'suspended', 'pending', 'rejected']),
    query('isVerified').optional().isIn(['all', 'verified', 'unverified', 'pending']),
    query('onlineStatus').optional().isIn(['all', 'online', 'offline']),
  ],
  validate,
  driverController.listDrivers
);


module.exports = router;
