// ════════════════════════════════════════════════════════════════════════════════
// Wallets - Controller
// Path: src/modules/wallets/wallets.controller.js
// ════════════════════════════════════════════════════════════════════════════════

const service = require('./wallets.service');
const { success, error } = require('../../utils/response');

/**
 * GET /api/v1/wallets/me
 * Get the authenticated user's or captain's own wallet
 */
exports.getMyWallet = async (req, res, next) => {
  try {
    const wallet = await service.getMyWallet(req.actor.id, req.actor.role);
    return success(res, wallet, 'Wallet retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/wallets/me/transactions
 * Get the authenticated user's or captain's own wallet transaction history
 */
exports.getMyTransactions = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await service.listMyTransactions(req.actor.id, req.actor.role, { page, limit });
    return success(res, result.data, 'Transactions retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/wallets/:id/transactions
 * Admin: get transaction history for any wallet by ID
 */
exports.getWalletTransactions = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await service.listWalletTransactions(req.params.id, { page, limit });
    return success(res, result.data, 'Transactions retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/wallets
 * List all wallets with optional filtering
 */
exports.listWallets = async (req, res, next) => {
  try {
    const filters = {
      page:      parseInt(req.query.page)  || 1,
      limit:     parseInt(req.query.limit) || 20,
      ownerType: req.query.ownerType || 'all',   // 'user' | 'captain' | 'all'
      search:    req.query.search,
    };

    const result = await service.listWallets(filters);

    res.set('X-Total-Count', result.total);
    res.set('X-Total-Pages', result.pages);

    return success(res, result.data, 'Wallets retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/admin/wallets/:id
 * Get a single wallet by ID
 */
exports.getWallet = async (req, res, next) => {
  try {
    const wallet = await service.getWallet(req.params.id);
    return success(res, wallet, 'Wallet retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/admin/wallets/:id/adjust
 * Credit or debit a wallet balance
 * Body: { type: 'credit'|'debit', amount: number, reason: string }
 */
exports.adjustWallet = async (req, res, next) => {
  try {
    const { type, amount, reason } = req.body;
    const wallet = await service.adjustWallet(req.params.id, {
      type,
      amount: parseFloat(amount),
      reason,
    });
    return success(res, wallet, `Wallet ${type}ed successfully`);
  } catch (err) {
    next(err);
  }
};
