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

const { configureSwagger } = require ('../swagger/swagger.config.js');

const logger = require('./config/logger');
const errorHandler = require('./middleware/error.middleware');
const { setupSocket } = require('./realtime/socket');

// ── Route Imports ─────────────────────────────────────────────────────────────
const authRoutes          = require('./modules/auth/auth.routes');
const usersRoutes         = require('./modules/users/users.routes');
const driversPublicRoutes      = require('./modules/drivers/drivers.public.routes');
const driversAdminRoutes      = require('./modules/drivers/drivers.admin.routes');
const tripsRoutes         = require('./modules/trips/trips.routes');
const promotionsRoutes    = require('./modules/coupons/coupons.routes');
const promotionsAdminRoutes = require('./modules/coupons/coupons.admin.routes');
const faqsRoutes          = require('./modules/faqs/faqs.routes');
const servicesRoutes      = require('./modules/services/services.routes');
const servicesPublicRoutes = require('./modules/services/services.public.routes');
const vehicleModelsRoutes       = require('./modules/vehicle-models/vehicleModels.admin.routes');
const vehicleModelsPublicRoutes = require('./modules/vehicle-models/vehicleModels.public.routes');
const vehiclesRoutes = require('./modules/vehicles/vehicles.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const supportRoutes       = require('./modules/support/support.routes');
const supportAdminRoutes  = require('./modules/support/support.admin.routes');
const analyticsRoutes     = require('./modules/analytics/analytics.routes');
// const adminRoutes         = require('./modules/admin/admin.routes');
const dashboardRoutes     = require('./modules/dashboard/dashboard.routes');
const regionsAdminRoutes       = require('./modules/regions/regions.admin.routes');
const regionsPublicRoutes = require('./modules/regions/regions.public.routes');
const tollGatesAdminRoutes = require('./modules/toll-gates/tollGates.admin.routes');
const paymentsRoutes      = require('./modules/payments/payments.routes.js');
const commissionRulesRoutes = require('./modules/commission-rules/commission-rules.routes');
const earningsRoutes        = require('./modules/earnings/earnings.routes');
const settingsRoutes      = require('./modules/settings/settings.routes');
const walletsPublicRoutes       = require('./modules/wallets/wallets.public.routes');
const walletsAdminRoutes       = require('./modules/wallets/wallets.admin.routes');
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
app.use((req, res, next) => {
  if (req.path.startsWith('/api/docs') || req.path.startsWith('/docs/')) return next();
  helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })(req, res, next);
});
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use('/uploads', express.static('uploads'));

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
const { adminSwaggerSpec } = configureSwagger(app);
app.use(
  '/docs/admin',
  swaggerUi.serveFiles(adminSwaggerSpec),
  swaggerUi.setup(adminSwaggerSpec)
);

// ── API Routes ────────────────────────────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`,          authRoutes);
app.use(`${API}/users`,         usersRoutes);
app.use(`${API}/admin/users`,   usersRoutes);
app.use(`${API}/drivers`,      driversPublicRoutes);
app.use(`${API}/admin/drivers`,      driversAdminRoutes);
app.use(`${API}/trips`,         tripsRoutes);
app.use(`${API}/promotions`,     promotionsRoutes);
app.use(`${API}/admin/promotions/coupons`, promotionsAdminRoutes);
app.use(`${API}/notifications`,  notificationsRoutes);
app.use(`${API}/support`,        supportRoutes);
app.use(`${API}/admin/support`,  supportAdminRoutes);
app.use(`${API}/admin/reports`, analyticsRoutes);
app.use(`${API}/faqs`,           faqsRoutes);
app.use(`${API}/services`,       servicesPublicRoutes);
app.use(`${API}/vehicle-models`, vehicleModelsPublicRoutes);
app.use(`${API}/admin/vehicle-models`, vehicleModelsRoutes);
app.use(`${API}/vehicles`, vehiclesRoutes);
app.use(`${API}/admin/vehicles`, vehiclesRoutes);
// app.use(`${API}/admin`,          adminRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/admin/regions`, regionsAdminRoutes);
app.use(`${API}/admin/toll-gates`, tollGatesAdminRoutes);
app.use(`${API}/regions`,       regionsPublicRoutes);
app.use(`${API}/admin/services`, servicesRoutes);
app.use(`${API}/admin/payments`, paymentsRoutes);
app.use(`${API}/payments`, paymentsRoutes);
app.use(`${API}/admin/commission-rules`, commissionRulesRoutes);
app.use(`${API}/admin/earnings`,         earningsRoutes);
app.use(`${API}/settings`,         settingsRoutes);
app.use(`${API}/admin/settings`,   settingsRoutes);
app.use(`${API}/wallets`,          walletsPublicRoutes);
app.use(`${API}/admin/wallets`,    walletsAdminRoutes);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Debug Endpoints (remove in production) ─────────────────────────────────────
app.get('/debug/locations', (req, res) => {
  const locationStore = require('./realtime/locationStore');
  const storeData = locationStore.getAll();
  return res.json({
    timestamp: new Date().toISOString(),
    driversOnlineCount: Object.keys(storeData).length,
    drivers: storeData
  });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` }));

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const prisma = require('./config/prisma');

// Clear stale isOnline flags from a previous crash or restart.
// Drivers who are truly active will reconnect their socket and call /duty/start again.
prisma.driverProfile.updateMany({ where: { isOnline: true }, data: { isOnline: false } })
  .then(({ count }) => { if (count > 0) logger.info(`Reset ${count} stale online driver(s) to offline`); })
  .catch((e) => logger.error('Failed to reset driver online flags on startup', e));

server.listen(PORT, () => {
  logger.info(`🚀 Tovo API running on http://localhost:${PORT}`);
  logger.info(`📖 Swagger docs at http://localhost:${PORT}/api/docs`);
  logger.info(`Public Swagger docs at http://localhost:${PORT}/docs/public`);
  logger.info(`Admin Swagger docs at http://localhost:${PORT}/docs/admin`);
  logger.info(`🔌 Socket.io ready`);
});

module.exports = { app, server, io };
