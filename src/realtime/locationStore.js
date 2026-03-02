/**
 * In-memory captain location store.
 *
 * Replaces per-update DB writes. Location data lives here during a captain's
 * shift and is discarded on disconnect, duty/end, or after 30 s of silence.
 *
 * Shape: Map<captainId, { lat, lng, heading, serviceId, ts }>
 *   serviceId — the service category this captain is assigned to (set once on connect)
 *   ts        — Date.now() of the last update, used to detect stale entries.
 */

const store = new Map();
const STALE_MS = 30_000; // entries older than 30 s are considered stale

const set = (captainId, { lat, lng, heading = null, serviceId = null }) => {
  // Preserve existing serviceId across location updates if not re-supplied
  const existing = store.get(captainId);
  store.set(captainId, {
    lat, lng, heading,
    serviceId: serviceId ?? existing?.serviceId ?? null,
    ts: Date.now(),
  });
};

const remove = (captainId) => {
  store.delete(captainId);
};

/**
 * Returns captains whose last known location falls within a bounding box
 * around (pickupLat, pickupLng). Stale entries are purged on the fly.
 * When serviceId is provided only captains assigned to that service are returned.
 *
 * @param {number}      pickupLat
 * @param {number}      pickupLng
 * @param {number}      [radiusKm=10]
 * @param {string|null} [serviceId=null]  — filter by captain's service category
 * @returns {{ id: string }[]}
 */
const getNearby = (pickupLat, pickupLng, radiusKm = 10, serviceId = null) => {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((pickupLat * Math.PI) / 180));
  const staleThreshold = Date.now() - STALE_MS;
  const results = [];

  for (const [captainId, loc] of store) {
    if (loc.ts < staleThreshold) {
      store.delete(captainId); // lazy cleanup
      continue;
    }
    if (serviceId && loc.serviceId !== serviceId) continue; // service filter
    if (
      Math.abs(loc.lat - pickupLat) <= latDelta &&
      Math.abs(loc.lng - pickupLng) <= lngDelta
    ) {
      results.push({ id: captainId });
    }
  }

  return results;
};

/** Periodic cleanup — call via setInterval to evict long-stale entries. */
const cleanup = () => {
  const staleThreshold = Date.now() - STALE_MS;
  for (const [captainId, loc] of store) {
    if (loc.ts < staleThreshold) store.delete(captainId);
  }
};

/** Returns the full store contents — useful for debugging. */
const getAll = () => Object.fromEntries(store);

module.exports = { set, remove, getNearby, cleanup, getAll };
