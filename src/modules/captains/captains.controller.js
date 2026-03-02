const service = require('./captains.service');
const { success, error } = require('../../utils/response');

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
    const avatarUrl = `/uploads/${req.file.filename}`;
    await service.updateAvatar(req.actor.id, avatarUrl);
    return success(res, { avatarUrl }, 'Avatar updated');
  } catch (err) {
    next(err);
  }
};

const startDuty = async (req, res, next) => {
  try {
    await service.startDuty(req.actor.id);
    return success(res, {}, 'You are now on duty — share your location via the socket to receive trip requests');
  } catch (err) {
    next(err);
  }
};

const endDuty = async (req, res, next) => {
  try {
    await service.endDuty(req.actor.id);
    return success(res, {}, 'You are now off duty');
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

const getInsuranceCards = async (req, res, next) => {
  try {
    const data = await service.getInsuranceCards(req.actor.id);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile, updateProfile, updateAvatar,
  startDuty, endDuty, getWallet,
  getInsuranceCards,
};
