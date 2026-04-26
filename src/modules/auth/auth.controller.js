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

const registerDriver = async (req, res, next) => {
  try {
    const { name, email, phone, driving_license, password, vin, vehicle_model_id } = req.body;
    const { driver, enrolledServices } = await authService.registerDriver({
      name,
      email,
      phone,
      driving_license,
      password,
      vin,
      vehicle_model_id,
    });

    return created(res, {
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
      },
      enrolled_services: enrolledServices.map((service) => ({
        id: service.id,
        name: service.name,
      })),
    }, 'Driver registered successfully');
  } catch (err) {
    return error(res, err.message || 'Internal server error', err.statusCode || err.status || 500);
  }
};

const login = async (req, res, next) => {
  try {
    const { identifier, email, password } = req.body;
    const data = await authService.login({ identifier, email, password });
    return success(res, data, 'Login successful');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
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
    await authService.logout(req.actor, refreshToken, fcm_token);
    return success(res, {}, 'Logged out successfully');
  } catch (err) {
    if (err.status) return error(res, err.message, err.status);
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

const verifyOtp = async (req, res, next) => {
  try {
    const data = await authService.verifyOtp(req.body.id_token);
    return success(res, data, 'Phone verified successfully');
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
  registerUser,
  registerDriver,
  login,
  adminLogin,
  logout,
  refreshToken,
  verifyOtp,
  forgotPassword,
  resetPassword,
  socialAuth,
};
