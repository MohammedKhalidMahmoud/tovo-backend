const router = require('express').Router();
const ctrl = require('./rbac.controller');
const { authenticate, requireSuperAdmin, requirePermission } = require('../../middleware/auth.middleware');

router.get('/roles', authenticate, requirePermission('settings:read'), ctrl.listRoles);
router.get('/roles/:id', authenticate, requirePermission('settings:read'), ctrl.getRoleById);
router.post('/roles', authenticate, requirePermission('settings:manage'), requireSuperAdmin, ctrl.createRole);
router.put('/roles/:id', authenticate, requirePermission('settings:manage'), requireSuperAdmin, ctrl.updateRole);
router.delete('/roles/:id', authenticate, requirePermission('settings:manage'), requireSuperAdmin, ctrl.deleteRole);

router.get('/permissions', authenticate, requirePermission('settings:read'), ctrl.listPermissions);

router.get('/staff', authenticate, requirePermission('settings:read'), ctrl.listStaff);
router.get('/staff/:id', authenticate, requirePermission('settings:read'), ctrl.getStaffById);
router.post('/staff', authenticate, requirePermission('settings:manage'), requireSuperAdmin, ctrl.createStaff);
router.put('/staff/:id', authenticate, requirePermission('settings:manage'), requireSuperAdmin, ctrl.updateStaff);
router.patch('/staff/:id/toggle-active', authenticate, requirePermission('settings:manage'), requireSuperAdmin, ctrl.toggleStaffActive);

module.exports = router;
