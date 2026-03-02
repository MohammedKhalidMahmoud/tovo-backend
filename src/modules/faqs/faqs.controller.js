// ════════════════════════════════════════════════════════════════════════════════
// FAQs - Public Controller
// Path: src/modules/faqs/faqs.controller.js
// ════════════════════════════════════════════════════════════════════════════════

const prisma = require('../../config/prisma');
const { success } = require('../../utils/response');

/**
 * GET /api/v1/faqs
 * Returns all active FAQs sorted by order.
 */
exports.listFaqs = async (req, res, next) => {
  try {
    const faqs = await prisma.faq.findMany({
      where:   { isActive: true },
      orderBy: { order: 'asc' },
    });
    return success(res, faqs, 'FAQs retrieved successfully');
  } catch (err) { next(err); }
};
