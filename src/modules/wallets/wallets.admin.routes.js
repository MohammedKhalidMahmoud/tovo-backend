// ════════════════════════════════════════════════════════════════════════════════
// Wallets - Routes
// Path: src/modules/wallets/wallets.routes.js
// ════════════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const walletsController = require('./wallets.controller');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');

router.get('/',                    authenticate, requirePermission('wallets:read'), walletsController.listWallets);
router.get('/:id',                 authenticate, requirePermission('wallets:read'), walletsController.getWallet);
router.get('/:id/transactions',    authenticate, requirePermission('wallets:read'), walletsController.getWalletTransactions);
router.post('/:id/adjust',         authenticate, requirePermission('wallets:manage'), walletsController.adjustWallet);

module.exports = router;
