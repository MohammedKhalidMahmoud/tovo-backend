const repo = require('./instructions.repository');

const normalizeBoolean = (value) => {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return Boolean(value);
};

const normalizeServiceIds = (serviceIds) => {
  if (serviceIds === undefined) return undefined;
  if (!Array.isArray(serviceIds)) return [];
  return [...new Set(serviceIds.filter(Boolean))];
};

const serializeInstruction = (instruction) => {
  if (!instruction) return instruction;
  const { services, ...data } = instruction;
  return {
    ...data,
    services: services?.map(({ service }) => service) ?? [],
  };
};

const buildInstructionWhere = ({ isActive, search, serviceId } = {}) => {
  const where = {};

  if (isActive !== undefined) where.isActive = isActive;
  if (serviceId) where.services = { some: { serviceId } };
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  return where;
};

const ensureServicesExist = async (serviceIds) => {
  if (!serviceIds || serviceIds.length === 0) return;

  const count = await repo.countServicesByIds(serviceIds);
  if (count !== serviceIds.length) {
    throw Object.assign(new Error('One or more services were not found'), { statusCode: 400 });
  }
};

const ensureServiceExists = async (serviceId) => {
  const service = await repo.findServiceById(serviceId);
  if (!service) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  return service;
};

const listInstructions = async ({ page = 1, limit = 20, isActive, search, serviceId } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 20);
  const where = buildInstructionWhere({ isActive, search, serviceId });

  const [total, data] = await Promise.all([
    repo.count(where),
    repo.findMany({
      where,
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
  ]);

  return {
    data: data.map(serializeInstruction),
    total,
    pages: Math.ceil(total / safeLimit),
  };
};

const getInstruction = async (id) => {
  const instruction = await repo.findById(id);
  if (!instruction) throw Object.assign(new Error('Instruction not found'), { statusCode: 404 });
  return serializeInstruction(instruction);
};

const listActiveInstructions = async ({ serviceId } = {}) => {
  if (serviceId) await ensureServiceExists(serviceId);
  const where = serviceId ? { services: { some: { serviceId } } } : {};
  const instructions = await repo.findActive(where);
  return instructions.map(serializeInstruction);
};

const getActiveInstruction = async (id) => {
  const instruction = await repo.findFirst({ id, isActive: true });
  if (!instruction) throw Object.assign(new Error('Instruction not found'), { statusCode: 404 });
  return serializeInstruction(instruction);
};

const createInstruction = async ({
  title,
  description,
  order = 0,
  isActive = true,
  serviceIds,
}) => {
  const normalizedServiceIds = normalizeServiceIds(serviceIds) ?? [];
  await ensureServicesExist(normalizedServiceIds);

  const instruction = await repo.create({
    title,
    description,
    order: Number(order) || 0,
    isActive: normalizeBoolean(isActive) ?? true,
  });

  if (normalizedServiceIds.length === 0) return serializeInstruction(await repo.findById(instruction.id));
  return serializeInstruction(await repo.replaceInstructionServices(instruction.id, normalizedServiceIds));
};

const updateInstruction = async (id, { title, description, order, isActive, serviceIds } = {}) => {
  await getInstruction(id);

  const data = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (order !== undefined) data.order = Number(order) || 0;
  if (isActive !== undefined) data.isActive = normalizeBoolean(isActive);

  let instruction = Object.keys(data).length > 0
    ? await repo.update(id, data)
    : await repo.findById(id);

  const normalizedServiceIds = normalizeServiceIds(serviceIds);
  if (normalizedServiceIds !== undefined) {
    await ensureServicesExist(normalizedServiceIds);
    instruction = await repo.replaceInstructionServices(id, normalizedServiceIds);
  }

  return serializeInstruction(instruction);
};

const deleteInstruction = async (id) => {
  await getInstruction(id);
  await repo.remove(id);
};

const getInstructionServices = async (instructionId) => {
  await getInstruction(instructionId);
  const links = await repo.findInstructionServices(instructionId);
  return links.map(({ service }) => service);
};

const linkInstructionService = async (instructionId, serviceId) => {
  await getInstruction(instructionId);
  await ensureServiceExists(serviceId);

  try {
    await repo.linkService(instructionId, serviceId);
  } catch (err) {
    if (err?.code === 'P2002') {
      throw Object.assign(new Error('Service already linked to this instruction'), { statusCode: 400 });
    }
    throw err;
  }
};

const unlinkInstructionService = async (instructionId, serviceId) => {
  await getInstruction(instructionId);
  await ensureServiceExists(serviceId);

  const existing = await repo.findServiceInstruction(instructionId, serviceId);
  if (!existing) {
    throw Object.assign(new Error('Service not linked to this instruction'), { statusCode: 404 });
  }

  await repo.unlinkService(instructionId, serviceId);
};

module.exports = {
  listInstructions,
  getInstruction,
  listActiveInstructions,
  getActiveInstruction,
  createInstruction,
  updateInstruction,
  deleteInstruction,
  getInstructionServices,
  linkInstructionService,
  unlinkInstructionService,
};
