const repo = require('./captains.repository');
const locationStore = require('../../realtime/locationStore');

const getProfile = async (captainId) => {
  const captain = await repo.findById(captainId);
  if (!captain) throw { status: 404, message: 'Captain not found' };
  const { passwordHash, ...safe } = captain;
  return safe;
};

const updateProfile = async (captainId, data) => {
  const updated = await repo.updateCaptain(captainId, data);
  const { passwordHash, ...safe } = updated;
  return safe;
};

const updateAvatar = (captainId, avatarUrl) =>
  repo.updateCaptain(captainId, { avatarUrl });

// Captain starts their shift — marks them online so they appear in nearby searches
const startDuty = (captainId) =>
  repo.updateCaptain(captainId, { isOnline: true });

// Captain ends their shift — marks offline and removes from location store
const endDuty = async (captainId) => {
  locationStore.remove(captainId);
  return repo.updateCaptain(captainId, { isOnline: false });
};

const getWallet = async (captainId) => {
  const wallet = await repo.getWallet(captainId);
  if (!wallet) throw { status: 404, message: 'Wallet not found' };
  return wallet;
};

const getInsuranceCards = (captainId) => repo.getInsuranceCards(captainId);

module.exports = {
  getProfile, updateProfile, updateAvatar,
  startDuty, endDuty, getWallet,
  getInsuranceCards,
};
