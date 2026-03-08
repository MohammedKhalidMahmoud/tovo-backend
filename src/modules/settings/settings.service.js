const repo = require('./settings.repository');

exports.getPublicSettings = async () => {
  const entries = await repo.findAll();
  return Object.fromEntries(entries.map((e) => [e.key, e.value]));
};

exports.listSettings = () => repo.findAll();

exports.createSetting = async (key, value) => {
  const existing = await repo.findByKey(key);
  if (existing) throw Object.assign(new Error(`Setting key "${key}" already exists`), { statusCode: 409 });
  return repo.create(key, value);
};

exports.updateSetting = async (id, data) => {
  const setting = await repo.findById(id);
  if (!setting) throw Object.assign(new Error('Setting not found'), { statusCode: 404 });
  if (data.key && data.key !== setting.key) {
    const conflict = await repo.findByKey(data.key);
    if (conflict) throw Object.assign(new Error(`Setting key "${data.key}" already exists`), { statusCode: 409 });
  }
  return repo.update(id, data);
};

exports.deleteSetting = async (id) => {
  const setting = await repo.findById(id);
  if (!setting) throw Object.assign(new Error('Setting not found'), { statusCode: 404 });
  return repo.remove(id);
};
