const { verifyAccessToken } = require('../utils/jwt');
const logger = require('../config/logger');
const locationStore = require('./locationStore');

/**
 * Tovo Real-Time Event Layer
 *
 * Rooms:
 *   user:{userId}         — user's private room
 *   captain:{captainId}   — captain's private room
 *   trip:{tripId}         — shared room for both parties during a trip
 *   captains:available    — broadcast room for trip.taken notifications
 *
 * Location tracking:
 *   Captain location is stored in the in-memory locationStore — zero DB writes.
 *   The store is queried synchronously when a trip is created to find nearby captains.
 */

const setupSocket = (io) => {
  // ── AUTH MIDDLEWARE ─────────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = verifyAccessToken(token);
      socket.actor = decoded; // { id, role }
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── STALE LOCATION CLEANUP ──────────────────────────────────────────────────
  // Evict entries that haven't sent a location update in 30 s.
  setInterval(() => locationStore.cleanup(), 30_000);

  io.on('connection', async (socket) => {
    const { id, role } = socket.actor;
    logger.info(`Socket connected: ${role}:${id} [${socket.id}]`);

    // Join private room
    socket.join(`${role}:${id}`);

    // Captains join the available-captains broadcast room and load their serviceId
    if (role === 'captain') {
      socket.join('captains:available');

      // One-time DB read per session — store serviceId on socket instance
      try {
        const prisma = require('../config/prisma');
        const captainData = await prisma.captain.findUnique({ where: { id }, select: { serviceId: true } });
        socket.captainServiceId = captainData?.serviceId ?? null;
      } catch (e) {
        logger.error('Failed to load captain serviceId on connect', e);
        socket.captainServiceId = null;
      }
    }

    // ── CLIENT EVENTS ─────────────────────────────────────────────────────────

    /**
     * Captain updates their GPS location.
     * Payload: { latitude, longitude, heading?, tripId? }
     *
     * Stored in-memory only — no DB write.
     * If the captain is in an active trip the position is forwarded to the
     * trip room so the user sees live movement on their map.
     */
    socket.on('captain.location_update', ({ latitude, longitude, heading, tripId }) => {
      if (role !== 'captain') return;

      logger.info(`Captain ${id} sent location: (${latitude}, ${longitude})`);
      locationStore.set(id, { lat: latitude, lng: longitude, heading, serviceId: socket.captainServiceId });

      if (tripId) {
        logger.info(`Forwarding location to trip room: trip:${tripId}`);
        io.to(`trip:${tripId}`).emit('trip.captain_location', { latitude, longitude, heading, captainId: id });
      }
    });

    /**
     * User joins a trip room to receive live updates.
     * Payload: { tripId }
     */
    socket.on('trip.join', ({ tripId }) => {
      socket.join(`trip:${tripId}`);
      logger.info(`${role}:${id} joined trip room: trip:${tripId}`);
    });

    /**
     * User or captain leaves a trip room.
     * Payload: { tripId }
     */
    socket.on('trip.leave', ({ tripId }) => {
      socket.leave(`trip:${tripId}`);
    });

    // ── DISCONNECT ────────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${role}:${id} [${socket.id}]`);

      if (role === 'captain') {
        // Remove from in-memory store immediately
        locationStore.remove(id);

        // Mark offline in DB so REST-layer duty checks stay consistent
        try {
          const prisma = require('../config/prisma');
          await prisma.captain.update({ where: { id }, data: { isOnline: false } });
        } catch (e) {
          logger.error('Failed to set captain offline on disconnect', e);
        }
      }
    });
  });
};

// ── SERVER-SIDE EMITTERS (called from controllers) ────────────────────────────

const emitCaptainMatched = (io, userId, tripData) => {
  io.to(`user:${userId}`).emit('trip.captain_matched', tripData);
};

const emitTripStatusChanged = (io, tripId, userId, captainId, status, tripData) => {
  io.to(`trip:${tripId}`)
    .to(`user:${userId}`)
    .to(`captain:${captainId}`)
    .emit('trip.status_changed', { tripId, status, trip: tripData });
};

const emitTripCancelled = (io, tripId, userId, captainId, cancelledBy) => {
  io.to(`trip:${tripId}`)
    .to(`user:${userId}`)
    .to(`captain:${captainId}`)
    .emit('trip.cancelled', { tripId, cancelledBy });
};

module.exports = {
  setupSocket,
  emitCaptainMatched,
  emitTripStatusChanged,
  emitTripCancelled,
};
