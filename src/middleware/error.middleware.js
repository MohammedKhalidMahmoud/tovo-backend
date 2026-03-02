const logger = require('../config/logger');
const { serverError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.message}`, { stack: err.stack, path: req.path });

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'A record with this value already exists.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found.' });
  }

  return serverError(res, err.message || 'Internal server error');
};

module.exports = errorHandler;
