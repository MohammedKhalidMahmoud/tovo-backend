// ════════════════════════════════════════════════════════════════════════════════
// Wallets - Admin Routes
// Path: src/modules/admin/wallets/wallets.routes.js
// ════════════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const walletsController   = require('./wallets.controller');

router.get('/',           walletsController.listWallets);
router.get('/:id',        walletsController.getWallet);
router.post('/:id/adjust', walletsController.adjustWallet);

module.exports = router;
