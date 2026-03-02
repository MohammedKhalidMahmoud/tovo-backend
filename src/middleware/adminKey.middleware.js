const { forbidden } = require('../utils/response');

const requireAdminKey = (req, res, next) => {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return forbidden(res, 'Admin access required');
  }
  next();
};

module.exports = { requireAdminKey };
