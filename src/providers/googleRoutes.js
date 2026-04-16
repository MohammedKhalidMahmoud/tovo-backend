const GOOGLE_ROUTES_ENDPOINT = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const ROUTES_FIELD_MASK = 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline';

const buildWaypoint = ({ lat, lng }) => ({
  location: {
    latLng: {
      latitude: Number(lat),
      longitude: Number(lng),
    },
  },
});

const getApiKey = () => {
  const apiKey = process.env.GOOGLE_ROUTES_API_KEY?.trim();
  if (!apiKey) {
    throw Object.assign(
      new Error('GOOGLE_ROUTES_API_KEY must be set in environment variables'),
      { statusCode: 500 }
    );
  }
  return apiKey;
};

// ─── MOCK ────────────────────────────────────────────────────────────────────
const computeDrivingRouteMock = async ({ origin, destination, intermediates = [] }) => {
  return {
    encodedPolyline: 'mock_w`{Iw`{I??_seK??_seK',
    distanceMeters: 12400,
    duration: '1320s',
  };
};
// ─────────────────────────────────────────────────────────────────────────────

const computeDrivingRoute = async ({ origin, destination, intermediates = [] }) => {
  if (process.env.USE_MOCK_ROUTES === 'true') {
    return computeDrivingRouteMock({ origin, destination, intermediates });
  }

  const response = await fetch(GOOGLE_ROUTES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': getApiKey(),
      'X-Goog-FieldMask': ROUTES_FIELD_MASK,
    },
    body: JSON.stringify({
      origin: buildWaypoint(origin),
      destination: buildWaypoint(destination),
      intermediates: intermediates.map(buildWaypoint),
      travelMode: 'DRIVE',
      computeAlternativeRoutes: false,
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    throw Object.assign(
      new Error(payload?.error?.message || 'Google Routes API request failed'),
      { statusCode: 502 }
    );
  }

  const route = payload?.routes?.[0];
  if (!route?.polyline?.encodedPolyline) {
    throw Object.assign(
      new Error('Google Routes API did not return an encoded polyline'),
      { statusCode: 502 }
    );
  }

  return {
    distanceMeters: Number(route.distanceMeters || 0),
    duration: route.duration || null,
    encodedPolyline: route.polyline.encodedPolyline,
  };
};

module.exports = {
  computeDrivingRoute,
};