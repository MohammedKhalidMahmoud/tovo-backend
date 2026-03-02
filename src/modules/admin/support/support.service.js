const prisma = require('../../../config/prisma');

exports.listComplaints = async (filters) => {
  const { page, limit, status, type, search } = filters;
  const where = {};
  if (status && status !== 'all') where.status = status;
  if (type) where.type = type;
  if (search) {
    where.message = { contains: search, mode: 'insensitive' };
  }

  const total = await prisma.supportTicket.count({ where });
  const data = await prisma.supportTicket.findMany({ where, skip: (page - 1) * limit, take: limit });
  return { data, total, pages: Math.ceil(total / limit) };
};

exports.getComplaint = async (id) => {
  return prisma.supportTicket.findUnique({ where: { id } });
};

exports.respondToComplaint = async (id, response) => {
  await prisma.supportTicket.update({ where: { id }, data: { response } });
};

exports.resolveComplaint = async (id) => {
  await prisma.supportTicket.update({ where: { id }, data: { status: 'resolved' } });
};
