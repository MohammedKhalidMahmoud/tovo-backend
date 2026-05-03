const prisma = require('../../config/prisma');

const withServices = {
  services: {
    include: { service: true },
    orderBy: { service: { name: 'asc' } },
  },
};

const findMany = ({ where = {}, skip = 0, take = 20 } = {}) =>
  prisma.instruction.findMany({
    where,
    include: withServices,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    skip,
    take,
  });

const count = (where = {}) => prisma.instruction.count({ where });

const findById = (id) =>
  prisma.instruction.findUnique({
    where: { id },
    include: withServices,
  });

const findFirst = (where) =>
  prisma.instruction.findFirst({
    where,
    include: withServices,
  });

const findActive = (where = {}) =>
  prisma.instruction.findMany({
    where: { ...where, isActive: true },
    include: withServices,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

const create = (data) => prisma.instruction.create({ data });

const update = (id, data) =>
  prisma.instruction.update({
    where: { id },
    data,
    include: withServices,
  });

const remove = (id) => prisma.instruction.delete({ where: { id } });

const countServicesByIds = (serviceIds) =>
  prisma.service.count({ where: { id: { in: serviceIds } } });

const findServiceById = (id) => prisma.service.findUnique({ where: { id } });

const findInstructionServices = (instructionId) =>
  prisma.serviceInstruction.findMany({
    where: { instructionId },
    include: { service: true },
    orderBy: { service: { name: 'asc' } },
  });

const replaceInstructionServices = async (instructionId, serviceIds) =>
  prisma.$transaction(async (tx) => {
    await tx.serviceInstruction.deleteMany({ where: { instructionId } });
    if (serviceIds.length > 0) {
      await tx.serviceInstruction.createMany({
        data: serviceIds.map((serviceId) => ({ instructionId, serviceId })),
        skipDuplicates: true,
      });
    }
    return tx.instruction.findUnique({
      where: { id: instructionId },
      include: withServices,
    });
  });

const linkService = (instructionId, serviceId) =>
  prisma.serviceInstruction.create({ data: { instructionId, serviceId } });

const findServiceInstruction = (instructionId, serviceId) =>
  prisma.serviceInstruction.findUnique({
    where: { serviceId_instructionId: { serviceId, instructionId } },
  });

const unlinkService = (instructionId, serviceId) =>
  prisma.serviceInstruction.delete({
    where: { serviceId_instructionId: { serviceId, instructionId } },
  });

module.exports = {
  findMany,
  count,
  findById,
  findFirst,
  findActive,
  create,
  update,
  remove,
  countServicesByIds,
  findServiceById,
  findInstructionServices,
  replaceInstructionServices,
  linkService,
  findServiceInstruction,
  unlinkService,
};
