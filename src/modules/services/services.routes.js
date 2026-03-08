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
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const ctrl = require('./services.controller');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `service-${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

const adminOnly = [authenticate, authorize('admin')];

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/', ctrl.listServices);
router.get('/:id', [param('id').isUUID()], validate, ctrl.getService);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.post(
  '/',
  ...adminOnly,
  [
    body('name').notEmpty().trim().withMessage('name is required'),
    body('baseFare').optional().isFloat({ min: 0 }).withMessage('baseFare must be a non-negative number'),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  ctrl.createService
);

router.patch(
  '/:id',
  ...adminOnly,
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 1 }).withMessage('name must not be empty'),
    body('baseFare').optional().isFloat({ min: 0 }).withMessage('baseFare must be a non-negative number'),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  ctrl.updateService
);

router.patch(
  '/:id/image',
  ...adminOnly,
  upload.single('image'),
  [param('id').isUUID()],
  validate,
  ctrl.updateServiceImage
);

module.exports = router;
