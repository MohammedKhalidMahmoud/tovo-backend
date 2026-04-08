const prisma = require('../../config/prisma');

const findMany = ({ where = {}, skip = 0, take = 20 } = {}) =>
  prisma.faq.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    skip,
    take,
  });

const count = (where = {}) => prisma.faq.count({ where });

const findById = (id) => prisma.faq.findUnique({ where: { id } });

const findAllActive = () =>
  prisma.faq.findMany({
    where: { isActive: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

const findActiveById = (id) =>
  prisma.faq.findFirst({
    where: { id, isActive: true },
  });

const create = (data) => prisma.faq.create({ data });

const update = (id, data) => prisma.faq.update({ where: { id }, data });

const remove = (id) => prisma.faq.delete({ where: { id } });

module.exports = {
  findMany,
  count,
  findById,
  findAllActive,
  findActiveById,
  create,
  update,
  remove,
};
