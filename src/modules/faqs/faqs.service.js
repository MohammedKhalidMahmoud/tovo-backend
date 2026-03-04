const prisma = require('../../config/prisma');

exports.listFaqs = async ({ page = 1, limit = 20, isActive } = {}) => {
  const where = {};
  if (isActive !== undefined) where.isActive = isActive;

  const [total, data] = await Promise.all([
    prisma.faq.count({ where }),
    prisma.faq.findMany({ where, orderBy: { order: 'asc' }, skip: (page - 1) * limit, take: limit }),
  ]);

  return { data, total, pages: Math.ceil(total / limit) };
};

exports.getFaq = async (id) => {
  const faq = await prisma.faq.findUnique({ where: { id } });
  if (!faq) throw Object.assign(new Error('FAQ not found'), { statusCode: 404 });
  return faq;
};

exports.createFaq = async ({ question, answer, order = 0 }) => {
  return prisma.faq.create({ data: { question, answer, order } });
};

exports.updateFaq = async (id, data) => {
  await exports.getFaq(id);
  return prisma.faq.update({ where: { id }, data });
};

exports.deleteFaq = async (id) => {
  await exports.getFaq(id);
  return prisma.faq.delete({ where: { id } });
};
