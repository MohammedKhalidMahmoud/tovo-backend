const bcrypt = require('bcryptjs');
const repo = require('./rbac.repository');

const normalizeStaff = (adminUser) => {
  if (!adminUser) return adminUser;

  return {
    ...adminUser,
    dashboardRole: adminUser.dashboardRole || null,
  };
};

const isProtectedRole = (role) => {
  const name = String(role?.name || '').trim().toLowerCase();
  return name === 'super_admin' || name === 'superadmin';
};

async function listRoles({ skip, limit, search }) {
  const where = {};
  if (search) where.name = { contains: search };

  const [items, total] = await repo.findRoles({ where, skip, take: limit });
  return { items, total };
}

async function getRoleById(id) {
  const role = await repo.findRoleById(id);
  if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  return role;
}

async function createRole(data) {
  const role = await repo.createRole({
    name: data.name,
    description: data.description,
    isSystem: false,
  });
  if (data.permissionIds?.length) {
    await repo.createRolePermissions(role.id, data.permissionIds);
  }
  return repo.findRoleById(role.id);
}

async function updateRole(id, data) {
  const existing = await repo.findRoleSummaryById(id);
  if (!existing) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  if (isProtectedRole(existing)) {
    throw Object.assign(new Error('Cannot modify super admin role'), { statusCode: 403 });
  }

  const role = await repo.updateRole(id, {
    name: data.name ?? existing.name,
    description: data.description ?? existing.description,
  });

  if (data.permissionIds !== undefined) {
    await repo.deleteRolePermissions(id);
    if (data.permissionIds.length) {
      await repo.createRolePermissions(id, data.permissionIds);
    }
  }

  return repo.findRoleById(role.id);
}

async function deleteRole(id) {
  const existing = await repo.findRoleSummaryById(id);
  if (!existing) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  if (existing.isSystem) throw Object.assign(new Error('Cannot delete system role'), { statusCode: 403 });

  const userCount = await repo.countDashboardAdminUsersByRoleId(id);
  if (userCount > 0) throw Object.assign(new Error('Cannot delete role with assigned users'), { statusCode: 400 });

  await repo.deleteRolePermissions(id);
  await repo.deleteRole(id);
}

async function listPermissions({ skip, limit, search }) {
  const where = {};
  if (search) {
    where.OR = [
      { label: { contains: search } },
      { key: { contains: search } },
    ];
  }

  const [items, total] = await repo.findPermissions({ where, skip, take: limit });
  return { items, total };
}

async function listStaff({ skip, limit, search, roleId, isActive }) {
  const where = {};
  if (search) {
    where.OR = [
      { email: { contains: search } },
      { name: { contains: search } },
    ];
  }
  if (roleId === 'admin') where.isAdmin = true;
  else if (roleId) where.dashboardRoleId = roleId;
  if (isActive !== undefined) where.isActive = String(isActive) === 'true';

  const [items, total] = await repo.findStaff({ where, skip, take: limit });
  return { items: items.map(normalizeStaff), total };
}

async function getStaffById(id) {
  const adminUser = await repo.findStaffById(id);
  if (!adminUser) {
    throw Object.assign(new Error('Staff member not found'), { statusCode: 404 });
  }
  return normalizeStaff(adminUser);
}

async function createStaff(data) {
  if (!data.email || !data.password) {
    throw Object.assign(new Error('Email and password are required'), { statusCode: 400 });
  }
  if (data.isAdmin) {
    throw Object.assign(new Error('Creating additional superadmin accounts is not allowed'), { statusCode: 403 });
  }

  const email = data.email.toLowerCase();
  const existing = await repo.findUserByEmail(email);
  if (existing) throw Object.assign(new Error('Email already in use'), { statusCode: 409 });

  const hash = await bcrypt.hash(data.password, 10);

  const adminUser = await repo.createStaff({
    email,
    passwordHash: hash,
    name: data.name || data.email,
    isAdmin: false,
    isActive: data.isActive ?? true,
    dashboardRoleId: data.dashboardRoleId || null,
  });

  return normalizeStaff(adminUser);
}

async function updateStaff(id, data, currentUserId) {
  const existing = await repo.findUserById(id);
  if (!existing) {
    throw Object.assign(new Error('Staff member not found'), { statusCode: 404 });
  }
  if (existing.isAdmin && id !== currentUserId) {
    throw Object.assign(new Error('Cannot modify another superadmin account'), { statusCode: 403 });
  }

  const updateData = {
    name: data.name ?? existing.name,
  };

  if (data.dashboardRoleId !== undefined && id !== currentUserId) {
    updateData.dashboardRoleId = data.dashboardRoleId;
  }

  if (data.isActive !== undefined && id !== currentUserId) {
    updateData.isActive = data.isActive;
  }

  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  const adminUser = await repo.updateStaff(id, updateData);

  return normalizeStaff(adminUser);
}

async function toggleStaffActive(id, currentUserId) {
  const existing = await repo.findUserById(id);
  if (!existing) {
    throw Object.assign(new Error('Staff member not found'), { statusCode: 404 });
  }
  if (id === currentUserId) {
    throw Object.assign(new Error('You cannot deactivate yourself'), { statusCode: 400 });
  }
  if (existing.isAdmin) {
    throw Object.assign(new Error('Cannot deactivate superadmin account'), { statusCode: 403 });
  }

  const adminUser = await repo.updateStaff(id, { isActive: !existing.isActive });
  return normalizeStaff(adminUser);
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
