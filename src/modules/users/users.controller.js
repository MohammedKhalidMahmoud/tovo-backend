const service = require('./users.service');
const { success, created, error } = require('../../utils/response');

const getProfile = async (req, res, next) => {
  try {
    const data = await service.getProfile(req.actor.id);
    return success(res, data);
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = await service.updateProfile(req.actor.id, req.body);
    return success(res, data, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

const updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);
    // In production: upload to S3/Cloudinary and get URL
    const avatarUrl = `/uploads/${req.file.filename}`;
    const data = await service.updateAvatar(req.actor.id, avatarUrl);
    return success(res, { avatarUrl }, 'Avatar updated');
  } catch (err) {
    next(err);
  }
};

const getWallet = async (req, res, next) => {
  try {
    const data = await service.getWallet(req.actor.id);
    return success(res, data);
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

// ── Addresses ─────────────────────────────────────────────────────────────────

const getSavedAddresses = async (req, res, next) => {
  try {
    const data = await service.getSavedAddresses(req.actor.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const addAddress = async (req, res, next) => {
  try {
    const data = await service.addAddress(req.actor.id, req.body);
    return created(res, data, 'Address saved');
  } catch (err) {
    next(err);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    await service.updateAddress(req.params.id, req.actor.id, req.body);
    return success(res, {}, 'Address updated');
  } catch (err) {
    next(err);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    await service.deleteAddress(req.params.id, req.actor.id);
    return success(res, {}, 'Address deleted');
  } catch (err) {
    next(err);
  }
};

// ── Wishlist ──────────────────────────────────────────────────────────────────

const getWishlist = async (req, res, next) => {
  try {
    const data = await service.getWishlist(req.actor.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const data = await service.addToWishlist(req.actor.id, req.body.item_ref);
    return created(res, data, 'Added to wishlist');
  } catch (err) {
    next(err);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    await service.removeFromWishlist(req.params.id, req.actor.id);
    return success(res, {}, 'Removed from wishlist');
  } catch (err) {
    next(err);
  }
};

// ── Payment Methods ───────────────────────────────────────────────────────────

const getPaymentMethods = async (req, res, next) => {
  try {
    const data = await service.getPaymentMethods(req.actor.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const addPaymentMethod = async (req, res, next) => {
  try {
    const data = await service.addPaymentMethod(req.actor.id, req.body);
    return created(res, data, 'Payment method added');
  } catch (err) {
    next(err);
  }
};

const deletePaymentMethod = async (req, res, next) => {
  try {
    await service.deletePaymentMethod(req.params.id, req.actor.id);
    return success(res, {}, 'Payment method removed');
  } catch (err) {
    next(err);
  }
};

const setDefaultPayment = async (req, res, next) => {
  try {
    await service.setDefaultPayment(req.params.id, req.actor.id);
    return success(res, {}, 'Default payment method updated');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile, updateProfile, updateAvatar, getWallet,
  getSavedAddresses, addAddress, updateAddress, deleteAddress,
  getWishlist, addToWishlist, removeFromWishlist,
  getPaymentMethods, addPaymentMethod, deletePaymentMethod, setDefaultPayment,
};
