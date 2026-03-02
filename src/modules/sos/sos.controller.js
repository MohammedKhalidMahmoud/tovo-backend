// ════════════════════════════════════════════════════════════════════════════════
// SOS - User/Captain Controller
// Path: src/modules/sos/sos.controller.js
// ════════════════════════════════════════════════════════════════════════════════

const service = require('./sos.service');
const { success } = require('../../utils/response');

/**
 * POST /api/v1/sos
 * Authenticated user or captain triggers an SOS alert.
 */
exports.triggerSos = async (req, res, next) => {
  try {
    const { lat, lng, message } = req.body;

    const userId    = req.user?.role === 'user'    ? req.user.id : null;
    const captainId = req.user?.role === 'captain' ? req.user.id : null;

    const alert = await service.triggerSos({ userId, captainId, lat, lng, message });
    return success(res, alert, 'SOS alert sent successfully', 201);
  } catch (err) { next(err); }
};
