const repo = require('./faqs.repository');

let activeFaqsCache = null;
let activeFaqsCacheAt = 0;
const FAQS_TTL_MS = 60_000;

const invalidateActiveFaqsCache = () => {
  activeFaqsCache = null;
  activeFaqsCacheAt = 0;
};

const buildFaqWhere = ({ isActive, search } = {}) => {
  const where = {};

  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.OR = [
      { question: { contains: search } },
      { answer: { contains: search } },
    ];
  }

  return where;
};

const listFaqs = async ({ page = 1, limit = 20, isActive, search } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 20);
  const where = buildFaqWhere({ isActive, search });

  const [total, data] = await Promise.all([
    repo.count(where),
    repo.findMany({
      where,
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
  ]);

  return {
    data,
    total,
    pages: Math.ceil(total / safeLimit),
  };
};

const getFaq = async (id) => {
  const faq = await repo.findById(id);
  if (!faq) throw Object.assign(new Error('FAQ not found'), { statusCode: 404 });
  return faq;
};

const listActiveFaqs = async () => {
  if (activeFaqsCache && Date.now() - activeFaqsCacheAt < FAQS_TTL_MS) {
    return activeFaqsCache;
  }

  const faqs = await repo.findAllActive();
  activeFaqsCache = faqs;
  activeFaqsCacheAt = Date.now();
  return faqs;
};

const getActiveFaq = async (id) => {
  const faq = await repo.findActiveById(id);
  if (!faq) throw Object.assign(new Error('FAQ not found'), { statusCode: 404 });
  return faq;
};

const createFaq = async ({ question, answer, order = 0, isActive = true }) => {
  const faq = await repo.create({
    question,
    answer,
    order,
    isActive,
  });
  invalidateActiveFaqsCache();
  return faq;
};

const updateFaq = async (id, { question, answer, order, isActive } = {}) => {
  await getFaq(id);

  const data = {};
  if (question !== undefined) data.question = question;
  if (answer !== undefined) data.answer = answer;
  if (order !== undefined) data.order = order;
  if (isActive !== undefined) data.isActive = isActive;

  const faq = await repo.update(id, data);
  invalidateActiveFaqsCache();
  return faq;
};

const deleteFaq = async (id) => {
  await getFaq(id);
  await repo.remove(id);
  invalidateActiveFaqsCache();
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
