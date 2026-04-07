/**
 * In-memory driver location store.
 *
 * Replaces per-update DB writes. Location data lives here during a driver's
 * shift and is discarded on disconnect, duty/end, or after 30 s of silence.
 *
 * Shape: Map<driverId, { lat, lng, heading, serviceId, ts }>
 *   serviceId — the service category this driver is assigned to (set once on connect)
 *   ts        — Date.now() of the last update, used to detect stale entries.
 */

const store = new Map();
const STALE_MS = 120_000; // entries older than 2 min are considered stale

const set = (driverId, { lat, lng, heading = null, serviceId = null }) => {
  // Preserve existing serviceId across location updates if not re-supplied
  const existing = store.get(driverId);
  store.set(driverId, {
    lat, lng, heading,
    serviceId: serviceId ?? existing?.serviceId ?? null,
    ts: Date.now(),
  });
};

const remove = (driverId) => {
  store.delete(driverId);
};

/**
 * Returns drivers whose last known location falls within a bounding box
 * around (pickupLat, pickupLng). Stale entries are purged on the fly.
 * When serviceId is provided only drivers assigned to that service are returned.
 *
 * @param {number}      pickupLat
 * @param {number}      pickupLng
 * @param {number}      [radiusKm=10]
 * @param {string|null} [serviceId=null]  — filter by driver's service category
 * @returns {{ id: string }[]}
 */
const getNearby = (pickupLat, pickupLng, radiusKm = 10, serviceId = null) => {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((pickupLat * Math.PI) / 180));
  const staleThreshold = Date.now() - STALE_MS;
  const results = [];

  for (const [driverId, loc] of store) {
    if (loc.ts < staleThreshold) {
      store.delete(driverId); // lazy cleanup
      continue;
    }
    if (serviceId && loc.serviceId !== serviceId) continue; // service filter
    if (
      Math.abs(loc.lat - pickupLat) <= latDelta &&
      Math.abs(loc.lng - pickupLng) <= lngDelta
    ) {
      results.push({ id: driverId });
    }
  }

  return results;
};

/** Periodic cleanup — call via setInterval to evict long-stale entries. */
const cleanup = () => {
  const staleThreshold = Date.now() - STALE_MS;
  for (const [driverId, loc] of store) {
    if (loc.ts < staleThreshold) store.delete(driverId);
  }
};

/** Returns the full store contents — useful for debugging. */
const getAll = () => Object.fromEntries(store);

/** Returns the location entry for a single driver, or undefined if not present. */
const get = (driverId) => store.get(driverId);

module.exports = { set, get, remove, getNearby, cleanup, getAll };
