const { verifyAccessToken } = require('../utils/jwt');
const { unauthorized, forbidden } = require('../utils/response');
const prisma = require('../config/prisma');

/**
 * Verifies JWT and attaches decoded user/driver to req.actor
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    let actor = null;

    if (decoded.role === 'admin') {
      actor = await prisma.adminUser.findUnique({
        where: { id: decoded.id },
        select: { id: true, role: true, isActive: true },
      });

      if (!actor || !actor.isActive) {
        return unauthorized(res, 'Invalid or expired token');
      }
    } else {
      actor = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, role: true },
      });

      if (!actor || actor.role !== decoded.role) {
        return unauthorized(res, 'Invalid or expired token');
      }
    }

    if (decoded.role === 'admin') {
      req.actor = { id: actor.id, role: 'admin', adminRole: actor.role };
    } else {
      req.actor = { id: actor.id, role: actor.role };
    }
    next();
  } catch (err) {
    return unauthorized(res, 'Invalid or expired token');
  }
};

/**
 * Role-based access guard — pass allowed roles as arguments
 * Usage: authorize('customer') | authorize('driver') | authorize('customer', 'driver') | authorize('admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.actor || !roles.includes(req.actor.role)) {
      return forbidden(res, `Access restricted to: ${roles.join(', ')}`);
    }
    next();
  };
};

module.exports = { authenticate, authorize };
