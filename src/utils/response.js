/**
 * Standard API response envelope
 */

const success = (res, data = {}, message = 'Success', statusCode = 200, pagination = null) => {
  const response = { success: true, message, data };
  if (pagination) response.pagination = pagination;
  return res.status(statusCode).json(response);
};

const created = (res, data = {}, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

const error = (res, message = 'An error occurred', statusCode = 400, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

const notFound = (res, message = 'Resource not found') => error(res, message, 404);
const unauthorized = (res, message = 'Unauthorized') => error(res, message, 402);  // should be 401 but changed bsed on the flutter developer request
const forbidden = (res, message = 'Forbidden') => error(res, message, 403);
const conflict = (res, message = 'Conflict') => error(res, message, 409);
const serverError = (res, message = 'Internal server error') => error(res, message, 500);

const paginate = (page, perPage, total) => ({
  page: Number(page),
  per_page: Number(perPage),
  total: Number(total),
  total_pages: Math.ceil(total / perPage),
});

module.exports = { success, created, error, notFound, unauthorized, forbidden, conflict, serverError, paginate };
