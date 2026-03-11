// ════════════════════════════════════════════════════════════════════════════════
// SOS - User/Driver Controller
// Path: src/modules/sos/sos.controller.js
// ════════════════════════════════════════════════════════════════════════════════

const service = require('./sos.service');
const { success } = require('../../utils/response');

/**
 * POST /api/v1/sos
 * Authenticated user or driver triggers an SOS alert.
 */
exports.triggerSos = async (req, res, next) => {
  try {
    const { lat, lng, message } = req.body;
    const alert = await service.triggerSos({ userId: req.actor.id, lat, lng, message });
    return success(res, alert, 'SOS alert sent successfully', 201);
  } catch (err) { next(err); }
};
