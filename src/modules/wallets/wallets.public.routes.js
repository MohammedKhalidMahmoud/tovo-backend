// ════════════════════════════════════════════════════════════════════════════════
// Wallets - Routes
// Path: src/modules/wallets/wallets.routes.js
// ════════════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const walletsController = require('./wallets.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// ── User / Driver routes ─────────────────────────────────────────────────────
router.get('/me',              authenticate, authorize('customer', 'driver'), walletsController.getMyWallet);
router.get('/me/transactions', authenticate, authorize('customer', 'driver'), walletsController.getMyTransactions);


module.exports = router;
