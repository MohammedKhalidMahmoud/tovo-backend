const repo = require('./tollGates.repository');

const listTollGates = async ({ page = 1, limit = 20 } = {}) => {
  const normalizedPage = Number(page) || 1;
  const normalizedLimit = Number(limit) || 20;
  const skip = (normalizedPage - 1) * normalizedLimit;

  const [data, total] = await Promise.all([
    repo.findAll({ skip, take: normalizedLimit }),
    repo.countAll(),
  ]);

  return { data, total, page: normalizedPage, limit: normalizedLimit };
};

const getTollGate = async (id) => {
  const tollGate = await repo.findById(id);
  if (!tollGate) throw { status: 404, message: 'Toll gate not found' };
  return tollGate;
};

const createTollGate = async ({ name, lat, lng, fee, isActive }) =>
  repo.create({
    name: String(name).trim(),
    lat: Number(lat),
    lng: Number(lng),
    fee,
    isActive: isActive ?? true,
  });

const updateTollGate = async (id, { name, lat, lng, fee, isActive }) => {
  await getTollGate(id);

  const data = {};
  if (name !== undefined) data.name = String(name).trim();
  if (lat !== undefined) data.lat = Number(lat);
  if (lng !== undefined) data.lng = Number(lng);
  if (fee !== undefined) data.fee = fee;
  if (isActive !== undefined) data.isActive = isActive;

  return repo.update(id, data);
};

const deleteTollGate = async (id) => {
  await getTollGate(id);
  await repo.remove(id);
};

module.exports = { listTollGates, getTollGate, createTollGate, updateTollGate, deleteTollGate };
