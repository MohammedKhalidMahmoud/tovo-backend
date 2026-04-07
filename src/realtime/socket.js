const { verifyAccessToken } = require('../utils/jwt');
const logger = require('../config/logger');
const locationStore = require('./locationStore');
const notificationsService = require('../modules/notifications/notifications.service');
const { resolveShareTokenSocketContext } = require('../modules/trips/trips.service');

const emitSocketEvent = ({ io, event, payload, rooms = [], socket }) => {
  if (socket) {
    socket.emit(event, payload);
    return;
  }

  const roomList = [...new Set(rooms.filter(Boolean))];
  if (!roomList.length) return;

  let emitter = io.to(roomList[0]);
  roomList.slice(1).forEach((room) => {
    emitter = emitter.to(room);
  });
  emitter.emit(event, payload);
};

const dedupePushTargets = (targets = []) => {
  const seen = new Set();

  return targets.filter((target) => {
    if (!target?.id || !target?.role) return false;
    const key = `${target.role}:${target.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildPushData = (event, payload = {}) => {
  const scalarPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value == null || ['string', 'number', 'boolean'].includes(typeof value))
  );

  return {
    event,
    type: event,
    payload: JSON.stringify(payload),
    ...scalarPayload,
  };
};

const emitRealtimeEvent = ({
  io,
  event,
  payload,
  rooms = [],
  socket,
  pushTargets = [],
  resolvePushTargets,
  buildNotification,
  skipPush = false,
}) => {
  emitSocketEvent({ io, event, payload, rooms, socket });

  if (skipPush || !buildNotification) return;

  const loadTargets = resolvePushTargets
    ? Promise.resolve(resolvePushTargets())
    : Promise.resolve(pushTargets);

  void loadTargets
    .then((targets) => dedupePushTargets(targets))
    .then((targets) =>
      Promise.allSettled(
        targets.map(async (target) => {
          const message = buildNotification(target, payload);
          if (!message?.title || !message?.body) return;

          await notificationsService.sendToActor(
            target.id,
            target.role,
            message.title,
            message.body,
            buildPushData(event, payload)
          );
        })
      )
    )
    .then((results) => {
      results
        .filter((result) => result.status === 'rejected')
        .forEach((result) => logger.error(`Failed to send push for ${event}`, result.reason));
    })
    .catch((err) => logger.error(`Failed to resolve push targets for ${event}`, err));
};

const formatMoney = (value) =>
  value == null || Number.isNaN(Number(value)) ? null : `${Number(value).toFixed(2)} EGP`;

const buildTripStatusNotification = (target, payload) => {
  const { status, trip = {} } = payload;

  if (status === 'in_progress') {
    return target.role === 'driver'
      ? { title: 'Trip Started', body: 'You have started the trip.' }
      : { title: 'Trip Started', body: 'Your trip is now in progress.' };
  }

  if (status === 'completed') {
    if (target.role === 'driver') {
      const reimbursement = Number(trip.discountAmount ?? 0) > 0
        ? ' Your coupon reimbursement has been credited as well.'
        : '';

      return {
        title: 'Trip Completed',
        body: `The trip has been completed successfully.${reimbursement}`,
      };
    }

    const fareText = formatMoney(trip.finalFare);
    return {
      title: 'Trip Completed',
      body: fareText ? `Your trip is complete. Final fare: ${fareText}.` : 'Your trip is complete.',
    };
  }

  return {
    title: 'Trip Updated',
    body: `Trip status changed to ${status}.`,
  };
};

const emitLastKnownCaptainLocation = ({ socket, tripId, driverId }) => {
  const loc = locationStore.get(driverId);
  if (!loc) return;

  emitRealtimeEvent({
    event: 'trip.captain_location',
    payload: {
      latitude: loc.lat,
      longitude: loc.lng,
      heading: loc.heading,
      captainId: driverId,
    },
    socket,
    skipPush: true,
  });
};

const setupSocket = (io) => {
  io.use(async (socket, next) => {
    const shareToken = socket.handshake.query?.shareToken || socket.handshake.auth?.shareToken;
    if (shareToken) {
      try {
        const trip = await resolveShareTokenSocketContext(String(shareToken));
        if (!trip) return next(new Error('Invalid or expired share token'));

        socket.actor = { id: trip.id, role: 'trip_share' };
        socket.shareTrip = trip;
        return next();
      } catch {
        return next(new Error('Invalid or expired share token'));
      }
    }

    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = verifyAccessToken(token);
      socket.actor = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  setInterval(() => locationStore.cleanup(), 30_000);

  io.on('connection', async (socket) => {
    const { id, role } = socket.actor;
    logger.info(`Socket connected: ${role}:${id} [${socket.id}]`);

    if (role === 'trip_share') {
      const { id: tripId, driverId } = socket.shareTrip;
      socket.join(`trip:${tripId}`);
      logger.info(`trip_share:${tripId} joined trip room: trip:${tripId}`);

      emitLastKnownCaptainLocation({ socket, tripId, driverId });
    } else {
      const privateRoom = role === 'customer' ? `user:${id}` : `${role}:${id}`;
      socket.join(privateRoom);
    }

    if (role === 'driver') {
      socket.join('captains:available');

      try {
        const prisma = require('../config/prisma');
        const driverData = await prisma.user.findUnique({ where: { id }, select: { serviceId: true } });
        socket.driverServiceId = driverData?.serviceId ?? null;
      } catch (e) {
        logger.error('Failed to load driver serviceId on connect', e);
        socket.driverServiceId = null;
      }
    }

    socket.on('captain.location_update', ({ latitude, longitude, heading, tripId }) => {
      if (role !== 'driver') return;

      logger.info(`Driver ${id} sent location: (${latitude}, ${longitude})`);
      locationStore.set(id, { lat: latitude, lng: longitude, heading, serviceId: socket.driverServiceId });

      if (tripId) {
        if (!socket.rooms.has(`trip:${tripId}`)) return;

        logger.info(`Forwarding location to trip room: trip:${tripId}`);
        emitRealtimeEvent({
          io,
          event: 'trip.captain_location',
          payload: { latitude, longitude, heading, captainId: id },
          rooms: [`trip:${tripId}`],
          skipPush: true,
        });
      }
    });

    socket.on('trip.join', async ({ tripId }) => {
      if (role === 'trip_share') {
        if (tripId !== socket.shareTrip?.id) return;
      }

      socket.join(`trip:${tripId}`);
      logger.info(`${role}:${id} joined trip room: trip:${tripId}`);

      try {
        const prisma = require('../config/prisma');
        const trip = await prisma.trip.findUnique({
          where: { id: tripId },
          select: { driverId: true, status: true },
        });

        if (trip?.driverId && ['matched', 'on_way', 'in_progress'].includes(trip.status)) {
          emitLastKnownCaptainLocation({ socket, tripId, driverId: trip.driverId });
        }
      } catch (e) {
        logger.error('Failed to push last known location on trip.join', e);
      }
    });

    socket.on('trip.leave', ({ tripId }) => {
      socket.leave(`trip:${tripId}`);
    });

    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${role}:${id} [${socket.id}]`);

      if (role === 'driver') {
        locationStore.remove(id);

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

const emitCaptainMatched = (io, userId, tripData) => {
  emitRealtimeEvent({
    io,
    event: 'trip.captain_matched',
    payload: tripData,
    rooms: [`user:${userId}`],
    pushTargets: [{ id: userId, role: 'customer' }],
    buildNotification: (_, trip) => ({
      title: 'Driver Matched',
      body: `${trip.driver?.name || 'Your driver'} accepted your trip.`,
    }),
  });
};

const emitTripStatusChanged = (io, tripId, userId, driverId, status, tripData) => {
  emitRealtimeEvent({
    io,
    event: 'trip.status_changed',
    payload: { tripId, status, trip: tripData },
    rooms: [`trip:${tripId}`, `user:${userId}`, driverId ? `driver:${driverId}` : null],
    pushTargets: [
      { id: userId, role: 'customer' },
      driverId ? { id: driverId, role: 'driver' } : null,
    ],
    buildNotification: buildTripStatusNotification,
  });
};

const emitTripCancelled = (io, tripId, userId, driverId, cancelledBy) => {
  emitRealtimeEvent({
    io,
    event: 'trip.cancelled',
    payload: { tripId, cancelledBy },
    rooms: [`trip:${tripId}`, `user:${userId}`, driverId ? `driver:${driverId}` : null],
    pushTargets: [
      { id: userId, role: 'customer' },
      driverId ? { id: driverId, role: 'driver' } : null,
    ],
    buildNotification: (target) => {
      if (target.role === 'driver') {
        return {
          title: 'Trip Cancelled',
          body: cancelledBy === driverId ? 'You cancelled this trip.' : 'The rider cancelled this trip.',
        };
      }

      return {
        title: 'Trip Cancelled',
        body: cancelledBy === userId ? 'You cancelled this trip.' : 'Your driver cancelled the trip.',
      };
    },
  });
};

const emitTripRequest = (io, trip, radiusKm = 10) => {
  const nearby = locationStore.getNearby(
    trip.pickupLat,
    trip.pickupLng,
    radiusKm,
    trip.serviceId ?? null,
  );

  if (!nearby.length) {
    logger.info(`No nearby drivers found for trip ${trip.id}`);
    return;
  }

  nearby.forEach(({ id: driverId }) => {
    emitRealtimeEvent({
      io,
      event: 'trip.new_request',
      payload: trip,
      rooms: [`driver:${driverId}`],
      pushTargets: [{ id: driverId, role: 'driver' }],
      buildNotification: () => ({
        title: 'New Trip Request',
        body: trip.pickupAddress
          ? `A new trip request is available near ${trip.pickupAddress}.`
          : 'A new trip request is available near you.',
      }),
    });
  });
};

const emitTripTaken = (io, trip) => {
  emitRealtimeEvent({
    io,
    event: 'trip.taken',
    payload: { tripId: trip.id },
    rooms: ['captains:available'],
    pushTargets: locationStore
      .getNearby(trip.pickupLat, trip.pickupLng, 10, trip.serviceId ?? null)
      .filter(({ id }) => id !== trip.driverId)
      .map(({ id }) => ({ id, role: 'driver' })),
    buildNotification: () => ({
      title: 'Trip No Longer Available',
      body: 'Another driver accepted this trip request.',
    }),
  });
};

const emitTripRemoved = (io, driverId, tripId) => {
  emitRealtimeEvent({
    io,
    event: 'trip.removed',
    payload: { tripId },
    rooms: [`driver:${driverId}`],
    pushTargets: [{ id: driverId, role: 'driver' }],
    buildNotification: () => ({
      title: 'Trip Removed',
      body: 'This trip request has been removed from your list.',
    }),
  });
};

module.exports = {
  setupSocket,
  emitRealtimeEvent,
  emitCaptainMatched,
  emitTripStatusChanged,
  emitTripCancelled,
  emitTripRequest,
  emitTripTaken,
  emitTripRemoved,
};
