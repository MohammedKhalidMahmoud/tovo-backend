// ════════════════════════════════════════════════════════════════════════════════
// Payments - Routes
// Path: src/modules/payments/payments.routes.js
// ════════════════════════════════════════════════════════════════════════════════

const router  = require('express').Router();
const { query, param } = require('express-validator');
const controller = require('./payments.controller');
const validate   = require('../../middleware/validate.middleware');
const { authenticate, authorize, requirePermission } = require('../../middleware/auth.middleware');

// ── Shared (user sees own, admin sees any) ────────────────────────────────────

// GET /payments/:id — single payment detail
router.get(
  '/:id',
  authenticate, (req, res, next) => {
    if (typeof req.actor?.isAdmin === 'boolean') {
      return requirePermission('payments:read')(req, res, next);
    }
    return authorize('customer')(req, res, next);
  },
  [ param('id').isUUID() ],
  validate,
  controller.getPayment
);

// ── Admin routes ──────────────────────────────────────────────────────────────

// GET /payments — all payments with filters
router.get(
  '/',
  authenticate, requirePermission('payments:read'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isString(),
    query('userId').optional().isUUID(),
    query('driverId').optional().isUUID(),
    query('paymentType').optional().equals('cash'),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
  ],
  validate,
  controller.listPayments
);

module.exports = router;
