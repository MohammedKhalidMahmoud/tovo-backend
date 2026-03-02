// ── SERVICE ───────────────────────────────────────────────────────────────────
const repo = require('./vehicles.repository');
const getAll = () => repo.getAll();
const getById = async (id) => {
  const vt = await repo.getById(id);
  if (!vt) throw { status: 404, message: 'Vehicle type not found' };
  return vt;
};
const addNewType = ({ name, description, imageUrl }) =>
  repo.create({ name, ...(description && { description }), ...(imageUrl && { imageUrl }) });
module.exports = { getAll, getById, addNewType };
