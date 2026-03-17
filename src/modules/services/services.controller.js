const service = require('./services.service');
const { success, error } = require('../../utils/response');
const { deleteLocalFile } = require('../../utils/uploads');

const withDefaultImage = (svc, req) => ({
  ...svc,
  imageUrl: svc.imageUrl ?? `${req.protocol}://${req.get('host')}/uploads/service-default.png`,
});

exports.listActiveServices = async (req, res, next) => {
  try {
    const services = await service.listActiveServices();
    return success(res, services.map(s => withDefaultImage(s, req)), 'Services retrieved successfully');
  } catch (err) { next(err); }
};

exports.getActiveService = async (req, res, next) => {
  try {
    const svc = await service.getService(req.params.id);
    if (!svc.isActive) return error(res, 'Service not found', 404);
    return success(res, withDefaultImage(svc, req), 'Service retrieved successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    await service.deleteService(req.params.id);
    return success(res, null, 'Service deleted successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

exports.listServices = async (req, res, next) => {
  try {
    const services = await service.listServices();
    return success(res, services.map(s => withDefaultImage(s, req)), 'Services retrieved successfully');
  } catch (err) { next(err); }
};

exports.getService = async (req, res, next) => {
  try {
    const svc = await service.getService(req.params.id);
    return success(res, withDefaultImage(svc, req), 'Service retrieved successfully');
  } catch (err) { next(err); }
};

exports.createService = async (req, res, next) => {
  try {
    const { name, baseFare, isActive } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Service name is required' });
    const svc = await service.createService({ name, baseFare, isActive });
    return success(res, svc, 'Service created successfully', 201);
  } catch (err) { next(err); }
};

exports.updateService = async (req, res, next) => {
  try {
    const svc = await service.updateService(req.params.id, req.body);
    return success(res, svc, 'Service updated successfully');
  } catch (err) { next(err); }
};

exports.updateServiceImage = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const oldUrl = await service.updateServiceImage(req.params.id, imageUrl);
    deleteLocalFile(oldUrl);
    return success(res, { imageUrl }, 'Service image updated');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};
