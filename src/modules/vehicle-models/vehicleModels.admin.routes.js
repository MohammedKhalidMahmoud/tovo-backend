// ════════════════════════════════════════════════════════════════════════════════
// Vehicle Models - Admin Routes
// Mounted at: /api/v1/admin/vehicle-models
// ════════════════════════════════════════════════════════════════════════════════

const router = require('express').Router();
const { body, param, query } = require('express-validator');
const multer = require('multer');
const path = require('path');
const ctrl = require('./vehicleModels.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');
const { error } = require('../../utils/response');

const adminRead = [authenticate, requirePermission('vehicle-models:read')];
const adminManage = [authenticate, requirePermission('vehicle-models:manage')];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!['.xlsx', '.xls'].includes(extension)) {
      return cb(new Error('Only .xlsx and .xls files are allowed'));
    }
    return cb(null, true);
  },
});

const importUpload = (req, res, next) => {
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'xlsx', maxCount: 1 },
    { name: 'excel', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) return error(res, err.message, 400);
    return next();
  });
};

// GET /admin/vehicle-models — list all models
router.get('/', ...adminRead, ctrl.listModels);

// POST /admin/vehicle-models/import-data - import models from an Excel file
router.post('/import-data', ...adminManage, importUpload, ctrl.importModels);

// GET /admin/vehicle-models/:id — get single model
router.get('/:id', ...adminRead, [param('id').isUUID()], validate, ctrl.getModel);

// POST /admin/vehicle-models — create new allowed model
router.post(
  '/',
  ...adminManage,
  [
    body('name').trim().isLength({ min: 1 }).withMessage('name is required'),
    body('brand').trim().isLength({ min: 1 }).withMessage('brand is required'),
    body('serviceId').isUUID().withMessage('serviceId is required and must be a valid UUID'),
    body('isActive').optional().isBoolean(),
    body('status').optional().isBoolean(),
  ],
  validate,
  ctrl.createModel,
);

// PUT /admin/vehicle-models/:id — update model
router.put(
  '/:id',
  ...adminManage,
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1 }),
    body('brand').optional().trim().isLength({ min: 1 }),
    body('serviceId').optional().isUUID().withMessage('serviceId must be a valid UUID'),
    body('isActive').optional().isBoolean(),
    body('status').optional().isBoolean(),
  ],
  validate,
  ctrl.updateModel,
);

// DELETE /admin/vehicle-models/:id?confirm=true — delete model
router.delete(
  '/:id',
  ...adminManage,
  [param('id').isUUID(), query('confirm').equals('true').withMessage('confirm=true is required')],
  validate,
  ctrl.deleteModel,
);

module.exports = router;
