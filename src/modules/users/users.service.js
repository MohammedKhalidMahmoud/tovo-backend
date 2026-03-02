const repo = require('./users.repository');

const getProfile = async (userId) => {
  const user = await repo.findById(userId);
  if (!user) throw { status: 404, message: 'User not found' };
  const { passwordHash, ...safe } = user;
  return safe;
};

const updateProfile = async (userId, data) => {
  const updated = await repo.updateUser(userId, data);
  const { passwordHash, ...safe } = updated;
  return safe;
};

const updateAvatar = async (userId, avatarUrl) => {
  return repo.updateUser(userId, { avatarUrl });
};

const getWallet = async (userId) => {
  const wallet = await repo.getWallet(userId);
  if (!wallet) throw { status: 404, message: 'Wallet not found' };
  return wallet;
};

// ── Addresses ─────────────────────────────────────────────────────────────────

const getSavedAddresses = (userId) => repo.getSavedAddresses(userId);

const addAddress = (userId, data) => repo.createAddress({ userId, ...data });

const updateAddress = (id, userId, data) => repo.updateAddress(id, userId, data);

const deleteAddress = (id, userId) => repo.deleteAddress(id, userId);

// ── Wishlist ──────────────────────────────────────────────────────────────────

const getWishlist = (userId) => repo.getWishlist(userId);

const addToWishlist = (userId, itemRef) => repo.addWishlistItem(userId, itemRef);

const removeFromWishlist = (id, userId) => repo.deleteWishlistItem(id, userId);

// ── Payment Methods ───────────────────────────────────────────────────────────

const getPaymentMethods = (userId) => repo.getPaymentMethods(userId);

const addPaymentMethod = (userId, data) => repo.createPaymentMethod({ userId, ...data });

const deletePaymentMethod = (id, userId) => repo.deletePaymentMethod(id, userId);

const setDefaultPayment = (id, userId) => repo.setDefaultPayment(id, userId);

module.exports = {
  getProfile, updateProfile, updateAvatar, getWallet,
  getSavedAddresses, addAddress, updateAddress, deleteAddress,
  getWishlist, addToWishlist, removeFromWishlist,
  getPaymentMethods, addPaymentMethod, deletePaymentMethod, setDefaultPayment,
};
