// ════════════════════════════════════════════════════════════════════════════════
// Wallets - Routes
// Path: src/modules/wallets/wallets.routes.js
// ════════════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const walletsController = require('./wallets.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// ── User / Captain routes ─────────────────────────────────────────────────────
router.get('/me',              authenticate, authorize('customer', 'driver'), walletsController.getMyWallet);
router.get('/me/transactions', authenticate, authorize('customer', 'driver'), walletsController.getMyTransactions);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/',                    authenticate, authorize('admin'), walletsController.listWallets);
router.get('/:id',                 authenticate, authorize('admin'), walletsController.getWallet);
router.get('/:id/transactions',    authenticate, authorize('admin'), walletsController.getWalletTransactions);
router.post('/:id/adjust',         authenticate, authorize('admin'), walletsController.adjustWallet);

module.exports = router;
