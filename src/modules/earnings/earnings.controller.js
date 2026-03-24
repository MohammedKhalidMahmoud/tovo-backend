const repo = require('./earnings.repository');
const { success, paginate } = require('../../utils/response');

const listEarnings = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, paymentType, serviceId, page = 1, perPage = 20 } = req.query;
    const { logs, total } = await repo.listCommissionLogs({
      dateFrom, dateTo, paymentType, serviceId,
      page: +page, perPage: +perPage,
    });
    const totalEarned = await repo.sumCommissionLogs();
    return success(res, { logs, totalEarned }, 'Commission earnings', 200,
      paginate(+page, +perPage, total));
  } catch (err) { next(err); }
};

module.exports = { listEarnings };
