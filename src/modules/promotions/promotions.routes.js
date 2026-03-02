const router = require('express').Router();
const { body, query, param } = require('express-validator');
const controller = require('./promotions.controller');
const validate = require('../../middleware/validate.middleware');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const adminOnly = [authenticate, authorize('admin')];

// public endpoints
router.get('/', authenticate, controller.getPromotions);
router.post('/coupons/validate', authenticate, [body('code').notEmpty()], validate, controller.validateCoupon);

// admin coupon management
router.get('/coupons',            adminOnly,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['all','active','inactive']),
    query('search').optional().trim(),
  ],
  validate,
  controller.listCoupons
);
router.post('/coupons',           adminOnly,
  [
    body('code').notEmpty(),
    body('discount_type').isIn(['percentage','amount']),
    body('discount').isFloat({ gt: 0 }),
  ],
  validate,
  controller.createCoupon
);
router.get('/coupons/:id',        adminOnly, [param('id').isUUID()], validate, controller.getCoupon);
router.put('/coupons/:id',        adminOnly,
  [param('id').isUUID()],
  validate,
  controller.updateCoupon
);
router.delete('/coupons/:id',     adminOnly, [param('id').isUUID()], validate, controller.deleteCoupon);

module.exports = router;
