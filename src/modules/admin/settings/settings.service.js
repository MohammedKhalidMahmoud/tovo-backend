const prisma = require('../../../config/prisma');

exports.getSettings = async () => {
  const entries = await prisma.systemSetting.findMany();
  const obj = {};
  entries.forEach((e) => { obj[e.key] = e.value; });
  return obj;
};

exports.updateSettings = async (data) => {
  const promises = [];
  Object.keys(data).forEach((key) => {
    promises.push(
      prisma.systemSetting.upsert({
        where: { key },
        update: { value: data[key] },
        create: { key, value: data[key] },
      })
    );
  });
  await Promise.all(promises);
  return exports.getSettings();
};
