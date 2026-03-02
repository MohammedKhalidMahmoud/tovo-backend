// ════════════════════════════════════════════════════════════════════════════════
// FAQs - Admin Controller
// Path: src/modules/admin/faqs/faqs.controller.js
// ════════════════════════════════════════════════════════════════════════════════

const service = require('./faqs.service');
const { success } = require('../../../utils/response');

exports.listFaqs = async (req, res, next) => {
  try {
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
    const result = await service.listFaqs({
      page:  parseInt(req.query.page)  || 1,
      limit: parseInt(req.query.limit) || 20,
      isActive,
    });
    res.set('X-Total-Count', result.total);
    res.set('X-Total-Pages', result.pages);
    return success(res, result.data, 'FAQs retrieved successfully');
  } catch (err) { next(err); }
};

exports.getFaq = async (req, res, next) => {
  try {
    const faq = await service.getFaq(req.params.id);
    return success(res, faq, 'FAQ retrieved successfully');
  } catch (err) { next(err); }
};

exports.createFaq = async (req, res, next) => {
  try {
    const faq = await service.createFaq(req.body);
    return success(res, faq, 'FAQ created successfully', 201);
  } catch (err) { next(err); }
};

exports.updateFaq = async (req, res, next) => {
  try {
    const faq = await service.updateFaq(req.params.id, req.body);
    return success(res, faq, 'FAQ updated successfully');
  } catch (err) { next(err); }
};

exports.deleteFaq = async (req, res, next) => {
  try {
    await service.deleteFaq(req.params.id);
    return success(res, null, 'FAQ deleted successfully');
  } catch (err) { next(err); }
};
