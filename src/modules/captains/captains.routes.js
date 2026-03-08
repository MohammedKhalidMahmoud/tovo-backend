const router = require('express').Router();
const { body, param, query } = require('express-validator');
const multer = require('multer');
const path   = require('path');
const captainController      = require('./captains.controller');
// const captainController = require('./captains.admin.captainController');
const tripsController = require('../trips/trips.controller');
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
const captainOnly = [authenticate, authorize('captain')];

// ── Profile ───────────────────────────────────────────────────────────────────
router.get('/me',                          ...captainOnly, captainController.getProfile);
router.put('/me',                          ...captainOnly, [
  body('name').optional().notEmpty().trim(),
  body('phone').optional().notEmpty().trim(),
  body('language').optional().isIn(['en', 'ar']).withMessage('language must be en or ar'),
  body('notificationsEnabled').optional().isBoolean(),
], validate, captainController.updateProfile);
router.patch('/me/avatar',                 ...captainOnly, upload.single('avatar'), captainController.updateAvatar);
router.post('/me/duty/start',              ...captainOnly, captainController.startDuty);
router.post('/me/duty/end',                ...captainOnly, captainController.endDuty);
router.get('/me/wallet',                   ...captainOnly, captainController.getWallet);

// ── Insurance ─────────────────────────────────────────────────────────────────
router.get('/me/insurance',                ...captainOnly, captainController.getInsuranceCards);

// ── Trip Management (Captain side) ────────────────────────────────────────────
router.get('/me/trips',                    ...captainOnly, tripsController.getCaptainTrips);
router.patch('/me/trips/:id/accept',       ...captainOnly, [param('id').isUUID()], validate, tripsController.acceptTrip);
router.patch('/me/trips/:id/decline',      ...captainOnly, [param('id').isUUID()], validate, tripsController.declineTrip);
router.patch('/me/trips/:id/start',        ...captainOnly, [param('id').isUUID()], validate, tripsController.startTrip);
router.patch('/me/trips/:id/end',          ...captainOnly, [param('id').isUUID()], validate, tripsController.endTrip);

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
  captainController.listDrivers
);

// CREATE driver - admin
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('name is required'),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isMobilePhone(),
    body('drivingLicense').optional().trim(),
  ],
  validate,
  captainController.createDriver
);

// ══════════════════════════════════════════════════════════════════════════════════
// DETAIL ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/v1/admin/drivers/:driverId
 * Get detailed information about a specific driver
 */
router.get(
  '/:driverId',
  [
    param('driverId').isUUID().withMessage('driverId must be a valid UUID'),
  ],
  validate,
  captainController.getDriver
);

// ══════════════════════════════════════════════════════════════════════════════════
// UPDATE ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════════════

/**
 * PUT /api/v1/admin/drivers/:driverId
 * Update driver information
 */
router.put(
  '/:driverId',
  [
    param('driverId').isUUID().withMessage('driverId must be a valid UUID'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim().isMobilePhone(),
    body('language').optional().isIn(['en', 'ar']),
    body('drivingLicense').optional().trim().isLength({ min: 5, max: 50 }),
    body('licenseExpiryDate').optional().isISO8601(),
  ],
  validate,
  captainController.updateDriver
);

/**
 * POST /api/v1/admin/drivers/:driverId/approve
 * Approve driver verification
 */
router.post(
  '/:driverId/approve',
  [
    param('driverId').isUUID().withMessage('driverId must be a valid UUID'),
    body('reason').optional().trim().isLength({ max: 500 }),
  ],
  validate,
  captainController.approveDriver
);

/**
 * POST /api/v1/admin/drivers/:driverId/reject
 * Reject driver application
 */
router.post(
  '/:driverId/reject',
  [
    param('driverId').isUUID().withMessage('driverId must be a valid UUID'),
    body('reason').trim().isLength({ min: 10, max: 500 }),
  ],
  validate,
  captainController.rejectDriver
);

/**
 * POST /api/v1/admin/drivers/:driverId/suspend
 * Suspend or unsuspend a driver account
 */
router.post(
  '/:driverId/suspend',
  [
    param('driverId').isUUID().withMessage('driverId must be a valid UUID'),
    body('action').isIn(['suspend', 'unsuspend']).withMessage('action must be suspend or unsuspend'),
    body('reason').optional().trim().isLength({ min: 5, max: 500 }),
    body('durationDays').optional().isInt({ min: 1, max: 365 }),
  ],
  validate,
  captainController.suspendDriver
);

/**
 * POST /api/v1/admin/drivers/:driverId/refund
 * Issue a refund to a driver account
 */
router.post(
  '/:driverId/refund',
  [
    param('driverId').isUUID().withMessage('driverId must be a valid UUID'),
    body('amount').isFloat({ min: 0.01 }).withMessage('amount must be > 0'),
    body('currency').isLength({ min: 3, max: 3 }).toUpperCase(),
    body('tripId').optional().isUUID(),
    body('reason').trim().isLength({ min: 5, max: 200 }),
  ],
  validate,
  captainController.issueRefund
);

/**
 * POST /api/v1/admin/drivers/:driverId/reset-password
 * Reset a driver's password
 */
router.post(
  '/:driverId/reset-password',
  [
    param('driverId').isUUID().withMessage('driverId must be a valid UUID'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  captainController.resetPassword
);

// ══════════════════════════════════════════════════════════════════════════════════
// DELETE ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════════════

/**
 * DELETE /api/v1/admin/drivers/:driverId
 * Delete a driver account permanently
 */
router.delete(
  '/:driverId',
  [
    param('driverId').isUUID().withMessage('driverId must be a valid UUID'),
    query('confirm').equals('true').withMessage('confirm parameter must be true'),
  ],
  validate,
  captainController.deleteDriver
);


module.exports = router;
