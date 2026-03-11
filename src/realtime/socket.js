const { verifyAccessToken } = require('../utils/jwt');
const logger = require('../config/logger');
const locationStore = require('./locationStore');

/**
 * Tovo Real-Time Event Layer
 *
 * Rooms:
 *   user:{userId}         — user's private room
 *   driver:{driverId}     — driver's private room
 *   trip:{tripId}         — shared room for both parties during a trip
 *   captains:available    — broadcast room for trip.taken notifications (drivers only)
 *
 * Location tracking:
 *   Driver location is stored in the in-memory locationStore — zero DB writes.
 *   The store is queried synchronously when a trip is created to find nearby drivers.
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

    // Drivers join the available-drivers broadcast room and load their serviceId
    if (role === 'driver') {
      socket.join('captains:available');

      // One-time DB read per session — store serviceId on socket instance
      try {
        const prisma = require('../config/prisma');
        const driverData = await prisma.user.findUnique({ where: { id }, select: { serviceId: true } });
        socket.driverServiceId = driverData?.serviceId ?? null;
      } catch (e) {
        logger.error('Failed to load driver serviceId on connect', e);
        socket.driverServiceId = null;
      }
    }

    // ── CLIENT EVENTS ─────────────────────────────────────────────────────────

    /**
     * Driver updates their GPS location.
     * Payload: { latitude, longitude, heading?, tripId? }
     *
     * Stored in-memory only — no DB write.
     * If the driver is in an active trip the position is forwarded to the
     * trip room so the user sees live movement on their map.
     */
    socket.on('captain.location_update', ({ latitude, longitude, heading, tripId }) => {
      if (role !== 'driver') return;

      logger.info(`Driver ${id} sent location: (${latitude}, ${longitude})`);
      locationStore.set(id, { lat: latitude, lng: longitude, heading, serviceId: socket.driverServiceId });

      if (tripId) {
        // Guard: only forward if this socket is actually in the trip room.
        // The server joins the captain to the room on trip accept, so this
        // check acts as zero-DB authorization — a spoofed tripId is silently ignored.
        if (!socket.rooms.has(`trip:${tripId}`)) return;
        logger.info(`Forwarding location to trip room: trip:${tripId}`);
        io.to(`trip:${tripId}`).emit('trip.captain_location', { latitude, longitude, heading, captainId: id });
      }
    });

    /**
     * User (or driver on reconnect) joins a trip room to receive live updates.
     * Payload: { tripId }
     * On join we immediately push the captain's last known position from the
     * in-memory store so the map isn't blank while waiting for the next update.
     */
    socket.on('trip.join', async ({ tripId }) => {
      socket.join(`trip:${tripId}`);
      logger.info(`${role}:${id} joined trip room: trip:${tripId}`);

      // Push last known captain position immediately on join (reconnect-safe)
      try {
        const prisma = require('../config/prisma');
        const trip = await prisma.trip.findUnique({
          where: { id: tripId },
          select: { driverId: true, status: true },
        });
        if (
          trip?.driverId &&
          ['matched', 'on_way', 'in_progress'].includes(trip.status)
        ) {
          const loc = locationStore.get(trip.driverId);
          if (loc) {
            socket.emit('trip.captain_location', {
              latitude: loc.lat,
              longitude: loc.lng,
              heading: loc.heading,
              captainId: trip.driverId,
            });
          }
        }
      } catch (e) {
        logger.error('Failed to push last known location on trip.join', e);
      }
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

      if (role === 'driver') {
        // Remove from in-memory store immediately
        locationStore.remove(id);

        // Mark offline in DB so REST-layer duty checks stay consistent
        try {
          const prisma = require('../config/prisma');
          await prisma.user.update({ where: { id }, data: { isOnline: false } });
        } catch (e) {
          logger.error('Failed to set driver offline on disconnect', e);
        }
      }
    });
  });
};

// ── SERVER-SIDE EMITTERS (called from controllers) ────────────────────────────

const emitCaptainMatched = (io, userId, tripData) => {
  io.to(`user:${userId}`).emit('trip.captain_matched', tripData);
};

const emitTripStatusChanged = (io, tripId, userId, driverId, status, tripData) => {
  io.to(`trip:${tripId}`)
    .to(`user:${userId}`)
    .to(`driver:${driverId}`)
    .emit('trip.status_changed', { tripId, status, trip: tripData });
};

const emitTripCancelled = (io, tripId, userId, driverId, cancelledBy) => {
  io.to(`trip:${tripId}`)
    .to(`user:${userId}`)
    .to(`driver:${driverId}`)
    .emit('trip.cancelled', { tripId, cancelledBy });
};

module.exports = {
  setupSocket,
  emitCaptainMatched,
  emitTripStatusChanged,
  emitTripCancelled,
};
