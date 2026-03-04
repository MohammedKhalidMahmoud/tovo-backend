require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const logger = require('./config/logger');
const errorHandler = require('./middleware/error.middleware');
const { setupSocket } = require('./realtime/socket');

// ── Route Imports ─────────────────────────────────────────────────────────────
const authRoutes          = require('./modules/auth/auth.routes');
const usersRoutes         = require('./modules/users/users.routes');
const captainsRoutes      = require('./modules/captains/captains.routes');
const tripsRoutes         = require('./modules/trips/trips.routes');
const locationsRoutes     = require('./modules/locations/locations.routes');
const vehiclesRoutes      = require('./modules/vehicles/vehicles.routes');
const promotionsRoutes    = require('./modules/promotions/promotions.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const supportRoutes       = require('./modules/support/support.routes');
const adminRoutes         = require('./modules/admin/admin.routes');
const dashboardRoutes     = require('./modules/dashboard/dashboard.routes');
const sosRoutes           = require('./modules/sos/sos.routes');
const publicFaqsRoutes    = require('./modules/faqs/faqs.routes');
const servicesRoutes      = require('./modules/services/services.routes');
const vehicleModelsRoutes = require('./modules/vehicle-models/vehicleModels.routes');

// ── App Setup ─────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});
setupSocket(io);
app.set('io', io); // make io available in controllers via req.app.get('io')

// ── Security & Middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Rate limiting - configurable via environment variables
const RATE_LIMIT_DISABLED = process.env.RATE_LIMIT_DISABLED === 'true';
const RATE_LIMIT_WINDOW_MINUTES = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 10) || 15;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100;

const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MINUTES * 60 * 1000, // minutes -> ms
  max: RATE_LIMIT_MAX,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

if (!RATE_LIMIT_DISABLED) {
  app.use('/api', limiter);
} else {
  logger.info('Rate limiter disabled (RATE_LIMIT_DISABLED=true)');
}

// ── Swagger UI ────────────────────────────────────────────────────────────────
const swaggerDoc = YAML.load(path.join(__dirname, '../swagger/openapi.yaml'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
  customSiteTitle: 'Tovo API Docs',
  customCss: '.swagger-ui .topbar { background-color: #1A3C5E; }',
}));

// ── API Routes ────────────────────────────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`,          authRoutes);
app.use(`${API}/users`,         usersRoutes);
app.use(`${API}/captains`,      captainsRoutes);
app.use(`${API}/trips`,         tripsRoutes);
app.use(`${API}/locations`,     locationsRoutes);
app.use(`${API}/vehicle-types`, vehiclesRoutes);
app.use(`${API}/promotions`,    promotionsRoutes);
app.use(`${API}/notifications`, notificationsRoutes);
app.use(`${API}/support/tickets`, supportRoutes);
app.use(`${API}/sos`,             sosRoutes);
app.use(`${API}/faqs`,            publicFaqsRoutes);
app.use(`${API}/services`,       servicesRoutes);
app.use(`${API}/vehicle-models`, vehicleModelsRoutes);
app.use(`${API}/admin`, adminRoutes);
app.use(`${API}`, dashboardRoutes); // provides /ride-requests/... and /rides/upcoming (and also /admin-dashboard by accident)
app.use(`${API}/dashboard`, dashboardRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Debug Endpoints (remove in production) ─────────────────────────────────────
app.get('/debug/locations', (req, res) => {
  const locationStore = require('./realtime/locationStore');
  const storeData = locationStore.getAll();
  return res.json({
    timestamp: new Date().toISOString(),
    captainsOnlineCount: Object.keys(storeData).length,
    captains: storeData
  });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` }));

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT;
const prisma = require('./config/prisma');

// Clear stale isOnline flags from a previous crash or restart.
// Captains who are truly active will reconnect their socket and call /duty/start again.
prisma.captain.updateMany({ where: { isOnline: true }, data: { isOnline: false } })
  .then(({ count }) => { if (count > 0) logger.info(`Reset ${count} stale online captain(s) to offline`); })
  .catch((e) => logger.error('Failed to reset captain online flags on startup', e));

server.listen(PORT, () => {
  logger.info(`🚀 Tovo API running on http://localhost:${PORT}`);
  logger.info(`📖 Swagger docs at http://localhost:${PORT}/api/docs`);
  logger.info(`🔌 Socket.io ready`);
});

module.exports = { app, server, io };
