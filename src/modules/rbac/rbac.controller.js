const svc = require('./rbac.service');
const { success, created, paginate } = require('../../utils/response');

const parseListQuery = (query = {}) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

async function listRoles(req, res, next) {
  try {
    const { page, limit, skip } = parseListQuery(req.query);
    const { items, total } = await svc.listRoles({ skip, limit, search: req.query.search });
    success(res, items, 'Success', 200, paginate(page, limit, total));
  } catch (e) { next(e); }
}

async function getRoleById(req, res, next) {
  try {
    const role = await svc.getRoleById(req.params.id);
    success(res, role);
  } catch (e) { next(e); }
}

async function createRole(req, res, next) {
  try {
    const role = await svc.createRole(req.body);
    created(res, role, 'Role created');
  } catch (e) { next(e); }
}

async function updateRole(req, res, next) {
  try {
    const role = await svc.updateRole(req.params.id, req.body);
    success(res, role, 'Role updated');
  } catch (e) { next(e); }
}

async function deleteRole(req, res, next) {
  try {
    await svc.deleteRole(req.params.id);
    success(res, null, 'Role deleted');
  } catch (e) { next(e); }
}

async function listPermissions(req, res, next) {
  try {
    const { page, limit, skip } = parseListQuery(req.query);
    const { items, total } = await svc.listPermissions({ skip, limit, search: req.query.search });
    success(res, items, 'Success', 200, paginate(page, limit, total));
  } catch (e) { next(e); }
}

async function listStaff(req, res, next) {
  try {
    const { page, limit, skip } = parseListQuery(req.query);
    const { items, total } = await svc.listStaff({
      skip,
      limit,
      search: req.query.search,
      roleId: req.query.roleId,
      isActive: req.query.isActive,
    });
    success(res, items, 'Success', 200, paginate(page, limit, total));
  } catch (e) { next(e); }
}

async function getStaffById(req, res, next) {
  try {
    const staff = await svc.getStaffById(req.params.id);
    success(res, staff);
  } catch (e) { next(e); }
}

async function createStaff(req, res, next) {
  try {
    const staff = await svc.createStaff(req.body);
    created(res, staff, 'Staff member created');
  } catch (e) { next(e); }
}

async function updateStaff(req, res, next) {
  try {
    const staff = await svc.updateStaff(req.params.id, req.body, req.actor?.id);
    success(res, staff, 'Staff member updated');
  } catch (e) { next(e); }
}

async function toggleStaffActive(req, res, next) {
  try {
    const staff = await svc.toggleStaffActive(req.params.id, req.actor?.id);
    success(res, staff, staff.isActive ? 'Staff member activated' : 'Staff member deactivated');
  } catch (e) { next(e); }
}

module.exports = {
  listRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  listPermissions,
  listStaff,
  getStaffById,
  createStaff,
  updateStaff,
  toggleStaffActive,
};
