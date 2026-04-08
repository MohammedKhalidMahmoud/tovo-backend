const service = require('./faqs.service');
const { success, error } = require('../../utils/response');

const listFaqs = async (req, res, next) => {
  try {
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
    const result = await service.listFaqs({
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 20,
      isActive,
      search: req.query.search,
    });

    res.set('X-Total-Count', result.total);
    res.set('X-Total-Pages', result.pages);
    return success(res, result.data, 'FAQs retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const getFaq = async (req, res, next) => {
  try {
    const faq = await service.getFaq(req.params.id);
    return success(res, faq, 'FAQ retrieved successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const listActiveFaqs = async (req, res, next) => {
  try {
    const data = await service.listActiveFaqs();
    return success(res, data);
  } catch (err) {
    next(err);
  }
};

const getActiveFaq = async (req, res, next) => {
  try {
    const faq = await service.getActiveFaq(req.params.id);
    return success(res, faq);
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const createFaq = async (req, res, next) => {
  try {
    const faq = await service.createFaq(req.body);
    return success(res, faq, 'FAQ created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateFaq = async (req, res, next) => {
  try {
    const faq = await service.updateFaq(req.params.id, req.body);
    return success(res, faq, 'FAQ updated successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const deleteFaq = async (req, res, next) => {
  try {
    await service.deleteFaq(req.params.id);
    return success(res, null, 'FAQ deleted successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

module.exports = {
  listFaqs,
  getFaq,
  listActiveFaqs,
  getActiveFaq,
  createFaq,
  updateFaq,
  deleteFaq,
};
