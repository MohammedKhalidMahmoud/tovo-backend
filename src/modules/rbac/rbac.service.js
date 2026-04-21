import bcrypt from 'bcryptjs';
import repo from './rbac.repository.js';

const normalizeStaff = (user) => {
  if (!user) return user;

  return {
    ...user,
    role: user.dashboardRole || null,
    dashboardRole: user.dashboardRole || null,
    isActive: true,
  };
};

const isProtectedRole = (role) =>
  String(role?.name || '').trim().toLowerCase() === 'superadmin';

export async function listRoles({ skip, limit, search }) {
  const where = {};
  if (search) where.name = { contains: search, mode: 'insensitive' };

  const [items, total] = await repo.findRoles({ where, skip, take: limit });
  return { items, total };
}

export async function getRoleById(id) {
  const role = await repo.findRoleById(id);
  if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  return role;
}

export async function createRole(data) {
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

export async function updateRole(id, data) {
  const existing = await repo.findRoleSummaryById(id);
  if (!existing) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  if (isProtectedRole(existing)) {
    throw Object.assign(new Error('Cannot modify superadmin role'), { statusCode: 403 });
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

export async function deleteRole(id) {
  const existing = await repo.findRoleSummaryById(id);
  if (!existing) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  if (existing.isSystem) throw Object.assign(new Error('Cannot delete system role'), { statusCode: 403 });

  const userCount = await repo.countDashboardAdminUsersByRoleId(id);
  if (userCount > 0) throw Object.assign(new Error('Cannot delete role with assigned users'), { statusCode: 400 });

  await repo.deleteRolePermissions(id);
  await repo.deleteRole(id);
}

export async function listPermissions({ skip, limit, search }) {
  const where = {};
  if (search) where.label = { contains: search, mode: 'insensitive' };

  const [items, total] = await repo.findPermissions({ where, skip, take: limit });
  return { items, total };
}

export async function listStaff({ skip, limit, search, roleId, isActive }) {
  const where = { role: 'dashboard_admin' };
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (roleId === 'admin') where.isAdmin = true;
  else if (roleId) where.dashboardRoleId = roleId;
  void isActive;

  const [items, total] = await repo.findStaff({ where, skip, take: limit });
  return { items: items.map(normalizeStaff), total };
}

export async function getStaffById(id) {
  const user = await repo.findStaffById(id);
  if (!user || user.role !== 'dashboard_admin') {
    throw Object.assign(new Error('Staff member not found'), { statusCode: 404 });
  }
  return normalizeStaff(user);
}

export async function createStaff(data) {
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

  const user = await repo.createStaff({
    email,
    passwordHash: hash,
    name: data.name || data.email,
    role: 'dashboard_admin',
    isAdmin: data.isAdmin || false,
    dashboardRoleId: data.dashboardRoleId || null,
  });

  return normalizeStaff(user);
}

export async function updateStaff(id, data, currentUserId) {
  const existing = await repo.findUserById(id);
  if (!existing || existing.role !== 'dashboard_admin') {
    throw Object.assign(new Error('Staff member not found'), { statusCode: 404 });
  }
  if (data.isAdmin === true && !existing.isAdmin) {
    throw Object.assign(new Error('Promoting another user to superadmin is not allowed'), { statusCode: 403 });
  }

  const updateData = {
    name: data.name ?? existing.name,
  };

  if (data.isAdmin !== undefined && id !== currentUserId) {
    updateData.isAdmin = data.isAdmin;
  }

  if (data.dashboardRoleId !== undefined && id !== currentUserId) {
    updateData.dashboardRoleId = data.dashboardRoleId;
  }

  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  const user = await repo.updateStaff(id, updateData);

  return normalizeStaff(user);
}

export async function toggleStaffActive(id, currentUserId) {
  const user = await repo.findUserById(id);
  if (!user || user.role !== 'dashboard_admin') {
    throw Object.assign(new Error('Staff member not found'), { statusCode: 404 });
  }
  if (id === currentUserId) {
    throw Object.assign(new Error('You cannot deactivate yourself'), { statusCode: 400 });
  }

  throw Object.assign(new Error('Staff activation status is not supported by the current schema'), { statusCode: 400 });
}
