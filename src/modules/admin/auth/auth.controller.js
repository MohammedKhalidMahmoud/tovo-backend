const authService = require('../../auth/auth.service');
const { success, error } = require('../../../utils/response');

exports.login = async (req, res, next) => {
  try {
    // delegate to common auth service with admin role
    const data = await authService.login({
      email: req.body.email,
      password: req.body.password,
      role: 'admin',
    });
    return success(res, data, 'Admin login successful');
  } catch (err) {
    next(err);
  }
};