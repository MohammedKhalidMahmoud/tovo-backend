const prisma = require('../../config/prisma');

exports.findAll = () => prisma.systemSetting.findMany({ orderBy: { createdAt: 'asc' } });

exports.findById = (id) => prisma.systemSetting.findUnique({ where: { id } });

exports.findByKey = (key) => prisma.systemSetting.findUnique({ where: { key } });

exports.create = (key, value) => prisma.systemSetting.create({ data: { key, value } });

exports.update = (id, data) => prisma.systemSetting.update({ where: { id }, data });

exports.remove = (id) => prisma.systemSetting.delete({ where: { id } });
