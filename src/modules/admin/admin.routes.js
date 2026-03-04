// ════════════════════════════════════════════════════════════════════════════════
// Admin Routes - Main Entry Point
// Path: src/modules/admin/admin.routes.js
// ════════════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// Admin middleware - verifies admin access
const adminOnly = [authenticate, authorize('admin')];

// Submodule routes
const usersRoutes = require('./users/users.routes');
const driversRoutes = require('./drivers/drivers.routes');
const ridesRoutes = require('./rides/rides.routes');
const pricingRoutes = require('./pricing/pricing.routes');
const vehiclesRoutes = require('./vehicles/fleet.routes');
const supportRoutes = require('./support/support.routes');
const complaintsRoutes = require('./complaints/complaints.routes');
const analyticsRoutes = require('./analytics/analytics.routes');
const settingsRoutes = require('./settings/settings.routes');
const adminsRoutes = require('./admins/admins.routes');
const paymentsRoutes = require('./payments/payments.routes');
const walletsRoutes  = require('./wallets/wallets.routes');
const sosRoutes      = require('./sos/sos.routes');
const faqsRoutes     = require('./faqs/faqs.routes');
const regionsRoutes       = require('./regions/regions.routes');
const servicesRoutes      = require('./services/services.routes');
const vehicleModelsRoutes = require('./vehicle-models/vehicleModels.routes');

// Note: Admin login now uses the main /api/v1/auth/login endpoint with role='admin'
// Apply admin authentication to all routes
router.use(adminOnly);

// Mount submodule routes
router.use('/users', usersRoutes);
router.use('/drivers', driversRoutes);
router.use('/rides', ridesRoutes);
router.use('/pricing', pricingRoutes);
router.use('/vehicles',     vehiclesRoutes);
router.use('/payments', paymentsRoutes);
router.use('/support', supportRoutes);
router.use('/complaints', complaintsRoutes);
router.use('/analytics', analyticsRoutes);
// legacy alias: reports were previously under /reports, keep compatibility
router.use('/reports', analyticsRoutes);
router.use('/settings', settingsRoutes);
router.use('/admins', adminsRoutes);
router.use('/wallets', walletsRoutes);
router.use('/sos',     sosRoutes);
router.use('/faqs',    faqsRoutes);
router.use('/regions',        regionsRoutes);
router.use('/services',       servicesRoutes);
router.use('/vehicle-models', vehicleModelsRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'Admin API is operational',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
