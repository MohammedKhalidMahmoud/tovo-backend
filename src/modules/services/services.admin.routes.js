// ════════════════════════════════════════════════════════════════════════════════
// Services - Public Routes
// Path: src/modules/services/services.routes.js
// Mounted at: /api/v1/services
// ════════════════════════════════════════════════════════════════════════════════
const router  = require('express').Router();
const { param, body } = require('express-validator');
const multer  = require('multer');
const path    = require('path');
const validate = require('../../middleware/validate.middleware');
const { authenticate, requirePermission } = require('../../middleware/auth.middleware');
const ctrl = require('./services.controller');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `service-${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

const adminRead = [authenticate, requirePermission('services:read')];
const adminManage = [authenticate, requirePermission('services:manage')];

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/', ...adminRead, ctrl.listServices);
router.get('/:id', ...adminRead, [param('id').isUUID()], validate, ctrl.getService);

router.post(
  '/',
  ...adminManage,
  [
    body('name').notEmpty().trim().withMessage('name is required'),
    body('baseFare').optional().isFloat({ min: 0 }).withMessage('baseFare must be a non-negative number'),
    body('fixedSurcharge').optional().isFloat({ min: 0 }).withMessage('fixedSurcharge must be a non-negative number'),
    body('perStopSurcharge').optional().isFloat({ min: 0 }).withMessage('perStopSurcharge must be a non-negative number'),
    body('requiresSenderCode').optional({ nullable: true }).isBoolean(),
    body('requiresReceiverCode').optional({ nullable: true }).isBoolean(),
    body('maxWeightKg').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('maxWeightKg must be a non-negative number'),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  ctrl.createService
);

router.patch(
  '/:id',
  ...adminManage,
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1 }).withMessage('name must not be empty'),
    body('baseFare').optional().isFloat({ min: 0 }).withMessage('baseFare must be a non-negative number'),
    body('fixedSurcharge').optional().isFloat({ min: 0 }).withMessage('fixedSurcharge must be a non-negative number'),
    body('perStopSurcharge').optional().isFloat({ min: 0 }).withMessage('perStopSurcharge must be a non-negative number'),
    body('requiresSenderCode').optional({ nullable: true }).isBoolean(),
    body('requiresReceiverCode').optional({ nullable: true }).isBoolean(),
    body('maxWeightKg').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('maxWeightKg must be a non-negative number'),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  ctrl.updateService
);

router.patch(
  '/:id/image',
  ...adminManage,
  upload.single('image'),
  [param('id').isUUID()],
  validate,
  ctrl.updateServiceImage
);

router.delete('/:id', ...adminManage, [param('id').isUUID()], validate, ctrl.deleteService);

// ── Vehicle Model Relations ───────────────────────────────────────────────
router.get('/:id/vehicle-models', ...adminRead, [param('id').isUUID()], validate, ctrl.getServiceVehicleModels);
router.post('/:id/vehicle-models', ...adminManage, [param('id').isUUID(), body('vehicleModelId').isUUID()], validate, ctrl.addServiceVehicleModel);
router.delete('/:id/vehicle-models/:vehicleModelId', ...adminManage, [param('id').isUUID(), param('vehicleModelId').isUUID()], validate, ctrl.removeServiceVehicleModel);

module.exports = router;
