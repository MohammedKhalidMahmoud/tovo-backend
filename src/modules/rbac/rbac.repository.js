const prisma = require('../../config/prisma');

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isAdmin: true,
  dashboardRoleId: true,
  createdAt: true,
  updatedAt: true,
  dashboardRole: {
    select: {
      id: true,
      name: true,
      description: true,
      isSystem: true,
    },
  },
};

const findRoles = ({ where = {}, skip = 0, take = 20 } = {}) =>
  Promise.all([
    prisma.dashboardRole.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    }),
    prisma.dashboardRole.count({ where }),
  ]);

const findRoleById = (id) =>
  prisma.dashboardRole.findUnique({
    where: { id },
    include: {
      permissions: { include: { permission: true } },
      users: { select: { id: true, name: true, email: true } },
    },
  });

const findRoleSummaryById = (id) =>
  prisma.dashboardRole.findUnique({ where: { id } });

const createRole = (data) =>
  prisma.dashboardRole.create({
    data,
  });

const updateRole = (id, data) =>
  prisma.dashboardRole.update({
    where: { id },
    data,
  });

const deleteRole = (id) =>
  prisma.dashboardRole.delete({ where: { id } });

const createRolePermissions = (dashboardRoleId, permissionIds) =>
  prisma.rolePermission.createMany({
    data: permissionIds.map((permissionId) => ({ dashboardRoleId, permissionId })),
  });

const deleteRolePermissions = (dashboardRoleId) =>
  prisma.rolePermission.deleteMany({ where: { dashboardRoleId } });

const countDashboardAdminUsersByRoleId = (dashboardRoleId) =>
  prisma.user.count({ where: { dashboardRoleId, role: 'dashboard_admin' } });

const findPermissions = ({ where = {}, skip = 0, take = 20 } = {}) =>
  Promise.all([
    prisma.permission.findMany({
      where,
      skip,
      take,
      orderBy: { key: 'asc' },
    }),
    prisma.permission.count({ where }),
  ]);

const findStaff = ({ where = {}, skip = 0, take = 20 } = {}) =>
  Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

const findStaffById = (id) =>
  prisma.user.findUnique({
    where: { id },
    select: {
      ...userSelect,
      dashboardRole: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  });

const findUserById = (id) =>
  prisma.user.findUnique({ where: { id } });

const findUserByEmail = (email) =>
  prisma.user.findUnique({ where: { email } });

const createStaff = (data) =>
  prisma.user.create({
    data,
    select: userSelect,
  });

const updateStaff = (id, data) =>
  prisma.user.update({
    where: { id },
    data,
    select: userSelect,
  });

module.exports = {
  findRoles,
  findRoleById,
  findRoleSummaryById,
  createRole,
  updateRole,
  deleteRole,
  createRolePermissions,
  deleteRolePermissions,
  countDashboardAdminUsersByRoleId,
  findPermissions,
  findStaff,
  findStaffById,
  findUserById,
  findUserByEmail,
  createStaff,
  updateStaff,
};
