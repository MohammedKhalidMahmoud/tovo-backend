const prisma = require('../../../config/prisma');

// ── Individual Vehicle CRUD ───────────────────────────────────────────────────

const vehicleInclude = {
  captain:      { select: { id: true, name: true, email: true, phone: true } },
  vehicleModel: true,
};

exports.listVehicles = async ({ page = 1, limit = 20, vehicleModelId, search } = {}) => {
  const where = {};
  if (vehicleModelId) where.vehicleModelId = vehicleModelId;
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

exports.createVehicle = async ({ captainId, vehicleModelId, vin }) => {
  const captainExists = await prisma.captain.findUnique({ where: { id: captainId } });
  if (!captainExists) throw Object.assign(new Error('Captain not found'), { statusCode: 404 });

  if (vehicleModelId) {
    const modelExists = await prisma.vehicleModel.findUnique({ where: { id: vehicleModelId } });
    if (!modelExists) throw Object.assign(new Error('Vehicle model not found'), { statusCode: 404 });
  }

  return prisma.vehicle.create({ data: { captainId, vehicleModelId, vin }, include: vehicleInclude });
};

exports.updateVehicle = async (id, { vehicleModelId, vin }) => {
  await exports.getVehicle(id);

  if (vehicleModelId) {
    const modelExists = await prisma.vehicleModel.findUnique({ where: { id: vehicleModelId } });
    if (!modelExists) throw Object.assign(new Error('Vehicle model not found'), { statusCode: 404 });
  }

  return prisma.vehicle.update({
    where: { id },
    data:  { ...(vehicleModelId && { vehicleModelId }), ...(vin && { vin }) },
    include: vehicleInclude,
  });
};

exports.deleteVehicle = async (id) => {
  await exports.getVehicle(id);
  await prisma.vehicle.delete({ where: { id } });
};
