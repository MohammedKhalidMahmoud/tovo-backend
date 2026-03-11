const prisma = require('../../config/prisma');

exports.findAll = async (filters = {}, pagination = {}) => {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.userId) where.userId = filters.userId;
  const [complaints, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return { complaints, total };
};

exports.findById = async (id) => {
  return prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
};

exports.createMessage = async (ticketId, senderId, body) => {
  return prisma.ticketMessage.create({
    data: {
      ticketId,
      senderId,
      body,
    },
  });
};

exports.updateStatus = async (id, status) => {
  return prisma.supportTicket.update({
    where: { id },
    data: {
      status,
      updatedAt: new Date(),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      messages: true,
    },
  });
};

exports.deleteComplaint = async (id) => {
  // Delete related ticket messages first
  await prisma.ticketMessage.deleteMany({
    where: { ticketId: id },
  });

  return prisma.supportTicket.delete({
    where: { id },
  });
};
