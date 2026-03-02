const prisma = require('../../../config/prisma');

// ── Vehicle Type CRUD ─────────────────────────────────────────────────────────

exports.listVehicleTypes = async () => {
  return prisma.vehicleType.findMany();
};

exports.createVehicleType = async (data) => {
  return prisma.vehicleType.create({ data });
};

exports.updateVehicleType = async (id, data) => {
  return prisma.vehicleType.update({ where: { id }, data });
};

exports.deleteVehicleType = async (id) => {
  await prisma.vehicleType.delete({ where: { id } });
};

// ── Individual Vehicle CRUD ───────────────────────────────────────────────────

const vehicleInclude = {
  captain: { select: { id: true, name: true, email: true, phone: true } },
  type:    true,
};

exports.listVehicles = async ({ page = 1, limit = 20, typeId, search } = {}) => {
  const where = {};
  if (typeId) where.typeId = typeId;
  if (search) {
    where.OR = [
      { vin:     { contains: search, mode: 'insensitive' } },
      { captain: { OR: [
        { name:  { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ] } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({ where, include: vehicleInclude, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
  ]);

  return { data, total, pages: Math.ceil(total / limit) };
};

exports.getVehicle = async (id) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id }, include: vehicleInclude });
  if (!vehicle) throw Object.assign(new Error('Vehicle not found'), { statusCode: 404 });
  return vehicle;
};

exports.createVehicle = async ({ captainId, typeId, vin }) => {
  const captainExists = await prisma.captain.findUnique({ where: { id: captainId } });
  if (!captainExists) throw Object.assign(new Error('Captain not found'), { statusCode: 404 });

  const typeExists = await prisma.vehicleType.findUnique({ where: { id: typeId } });
  if (!typeExists) throw Object.assign(new Error('Vehicle type not found'), { statusCode: 404 });

  return prisma.vehicle.create({ data: { captainId, typeId, vin }, include: vehicleInclude });
};

exports.updateVehicle = async (id, { typeId, vin }) => {
  await exports.getVehicle(id); // ensure exists

  if (typeId) {
    const typeExists = await prisma.vehicleType.findUnique({ where: { id: typeId } });
    if (!typeExists) throw Object.assign(new Error('Vehicle type not found'), { statusCode: 404 });
  }

  return prisma.vehicle.update({
    where: { id },
    data:  { ...(typeId && { typeId }), ...(vin && { vin }) },
    include: vehicleInclude,
  });
};

exports.deleteVehicle = async (id) => {
  await exports.getVehicle(id); // ensure exists
  await prisma.vehicle.delete({ where: { id } });
};
