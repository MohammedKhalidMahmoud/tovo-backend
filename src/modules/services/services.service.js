// ════════════════════════════════════════════════════════════════════════════════
// Services - Service Layer
// Path: src/modules/services/services.service.js
// ════════════════════════════════════════════════════════════════════════════════

const repo = require('./services.repository');

exports.listActiveServices = () => repo.findAll();
