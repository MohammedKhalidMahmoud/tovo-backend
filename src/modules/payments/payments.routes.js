// ════════════════════════════════════════════════════════════════════════════════
// Payments - Routes
// Path: src/modules/payments/payments.routes.js
// ════════════════════════════════════════════════════════════════════════════════

const router  = require('express').Router();
const { query, param } = require('express-validator');
const controller = require('./payments.controller');
const validate   = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// ── User routes ───────────────────────────────────────────────────────────────

// GET /payments/me — own payment history
router.get(
  '/me',
  authenticate, authorize('customer'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  controller.listMyPayments
);

// ── Shared (user sees own, admin sees any) ────────────────────────────────────

// GET /payments/:id — single payment detail
router.get(
  '/:id',
  authenticate, authorize('customer', 'admin'),
  [ param('id').isUUID() ],
  validate,
  controller.getPayment
);

// ── Admin routes ──────────────────────────────────────────────────────────────

// GET /payments — all payments with filters
router.get(
  '/',
  authenticate, authorize('admin'),
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
