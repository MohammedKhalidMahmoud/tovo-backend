import { Router } from 'express';
import * as ctrl from './rbac.controller.js';
import { authenticate, requireSuperAdmin, requirePermission } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/roles', authenticate, requirePermission('roles.read'), ctrl.listRoles);
router.get('/roles/:id', authenticate, requirePermission('roles.read'), ctrl.getRoleById);
router.post('/roles', authenticate, requirePermission('roles.edit'), requireSuperAdmin, ctrl.createRole);
router.put('/roles/:id', authenticate, requirePermission('roles.edit'), requireSuperAdmin, ctrl.updateRole);
router.delete('/roles/:id', authenticate, requirePermission('roles.edit'), requireSuperAdmin, ctrl.deleteRole);

router.get('/permissions', authenticate, requirePermission('roles.read'), ctrl.listPermissions);

router.get('/staff', authenticate, requirePermission('staff.read'), ctrl.listStaff);
router.get('/staff/:id', authenticate, requirePermission('staff.read'), ctrl.getStaffById);
router.post('/staff', authenticate, requirePermission('staff.edit'), requireSuperAdmin, ctrl.createStaff);
router.put('/staff/:id', authenticate, requirePermission('staff.edit'), requireSuperAdmin, ctrl.updateStaff);
router.patch('/staff/:id/toggle-active', authenticate, requirePermission('staff.edit'), requireSuperAdmin, ctrl.toggleStaffActive);

export default router;
