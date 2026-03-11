const authService = require('./auth.service');
const { success, created, error } = require('../../utils/response');

const registerUser = async (req, res, next) => {
  try {
    const data = await authService.registerUser(req.body);
    return created(res, data, 'User registered successfully');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const registerCaptain = async (req, res, next) => {
  try {
    const { driving_license, vehicle_model, ...rest } = req.body;
    const data = await authService.registerCaptain({
      ...rest,
      drivingLicense: driving_license,
      vehicleModelName: vehicle_model,
    });
    return created(res, data, 'Captain registered successfully');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    return success(res, data, 'Login successful');
  } catch (err) {
    const statusCode = err.status === '401' ? 402 : err.status;
    if (err.status) return error(res, err.message, statusCode);
    next(err);
  }
};

const adminLogin = async (req, res, next) => {
  try {
    const data = await authService.adminLogin(req.body);
    return success(res, data, 'Login successful');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken, fcm_token } = req.body;
    await authService.logout(refreshToken, fcm_token);
    return success(res, {}, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    const data = await authService.refreshToken(token);
    return success(res, data, 'Token refreshed');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const sendOtp = async (req, res, next) => {
  try {
    const data = await authService.sendOtp(req.body.phone);
    return success(res, {otp: 123456}, 'OTP sent');
  } catch (err) {
    next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const data = await authService.verifyOtp(req.body.phone, req.body.otp_code);
    return success(res, data, 'OTP verified');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const data = await authService.forgotPassword(req.body.email);
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, new_password } = req.body;
    const data = await authService.resetPassword(email, otp, new_password);
    return success(res, data, 'Password reset successful');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

const socialAuth = async (req, res, next) => {
  try {
    const data = await authService.socialAuth(req.body);
    return success(res, data, 'Social login successful');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
    next(err);
  }
};

module.exports = {
  registerUser, registerCaptain, login, adminLogin, logout,
  refreshToken, sendOtp, verifyOtp,
  forgotPassword, resetPassword, socialAuth,
};
