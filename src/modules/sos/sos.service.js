// ════════════════════════════════════════════════════════════════════════════════
// SOS - User/Captain Service
// Path: src/modules/sos/sos.service.js
// ════════════════════════════════════════════════════════════════════════════════

const prisma = require('../../config/prisma');

exports.triggerSos = async ({ userId, captainId, lat, lng, message }) => {
  return prisma.sosAlert.create({
    data: { userId: userId || null, captainId: captainId || null, lat, lng, message },
  });
};
