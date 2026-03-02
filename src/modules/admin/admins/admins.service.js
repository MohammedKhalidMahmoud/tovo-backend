const prisma = require('../../../config/prisma');
const bcrypt = require('bcryptjs');

exports.listAdmins = async () => {
  return prisma.adminUser.findMany({ where: { isActive: true } });
};

exports.createAdmin = async (data) => {
  const hash = await bcrypt.hash(data.password, 10);
  return prisma.adminUser.create({ data: { name: data.name, email: data.email, role: data.role, passwordHash: hash } });
};

exports.updateAdmin = async (id, data) => {
  const update = { ...data };
  if (data.password) {
    update.passwordHash = await bcrypt.hash(data.password, 10);
    delete update.password;
  }
  return prisma.adminUser.update({ where: { id }, data: update });
};

exports.deleteAdmin = async (id) => {
  await prisma.adminUser.update({ where: { id }, data: { isActive: false } });
};
