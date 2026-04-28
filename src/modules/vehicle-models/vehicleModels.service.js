const repo = require('./vehicleModels.repository');
const prisma = require('../../config/prisma');
const XLSX = require('xlsx');

const listModels = () => repo.findAll();

const listActiveModels = () => repo.findActive();

const getModel = async (id) => {
  const model = await repo.findById(id);
  if (!model) throw { status: 404, message: 'Vehicle model not found' };
  return model;
};

const getActiveModel = async (id) => {
  const model = await repo.findActiveById(id);
  if (!model) throw { status: 404, message: 'Vehicle model not found' };
  return model;
};

const validateServiceExists = async (serviceId) => {
  const svc = await prisma.service.findUnique({ where: { id: serviceId }, select: { id: true } });
  if (!svc) throw { status: 400, message: 'serviceId does not match any existing service' };
};

const normalizeBoolean = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return Boolean(value);
};

const parseImportBoolean = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;

  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'active', 'enabled'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n', 'inactive', 'disabled'].includes(normalized)) return false;
  return null;
};

const normalizeStatusFields = ({ isActive, status }) => {
  const normalizedStatus = normalizeBoolean(status);
  const normalizedIsActive = normalizeBoolean(isActive);
  const effectiveStatus = normalizedStatus ?? normalizedIsActive ?? true;

  return {
    isActive: normalizedIsActive ?? effectiveStatus,
    status: effectiveStatus,
  };
};

const createModel = async ({ name, brand, serviceId, isActive, status }) => {
  const existing = await repo.findByName(name);
  if (existing) throw { status: 409, message: 'A vehicle model with this name already exists' };
  await validateServiceExists(serviceId);
  return repo.create({ name, brand, serviceId, ...normalizeStatusFields({ isActive, status }) });
};

const normalizeHeader = (header) => String(header || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const getCellValue = (row, aliases) => {
  const normalizedAliases = aliases.map(normalizeHeader);
  return Object.entries(row).find(([key]) => normalizedAliases.includes(normalizeHeader(key)))?.[1];
};

const normalizeString = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const parseImportRows = (buffer) => {
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch (err) {
    throw { status: 400, message: 'Invalid Excel file' };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw { status: 400, message: 'Excel file has no sheets' };

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
  return rows.map((row, index) => ({
    rowNumber: index + 2,
    name: normalizeString(getCellValue(row, ['name', 'model', 'modelName', 'vehicleModel', 'vehicleModelName'])),
    brand: normalizeString(getCellValue(row, ['brand', 'make', 'manufacturer'])),
    service: normalizeString(getCellValue(row, ['serviceId', 'service_id', 'service', 'serviceName', 'service_name'])),
    isActive: getCellValue(row, ['isActive', 'is_active', 'active']),
    status: getCellValue(row, ['status']),
  }));
};

const loadServiceLookup = async () => {
  const services = await prisma.service.findMany({ select: { id: true, name: true } });
  return services.reduce((lookup, service) => {
    lookup.byId.set(service.id, service.id);
    lookup.byName.set(service.name.trim().toLowerCase(), service.id);
    return lookup;
  }, { byId: new Map(), byName: new Map() });
};

const resolveServiceId = (serviceValue, serviceLookup) => {
  if (!serviceValue) return null;
  return serviceLookup.byId.get(serviceValue) || serviceLookup.byName.get(serviceValue.toLowerCase()) || null;
};

const importModels = async (buffer) => {
  const rows = parseImportRows(buffer);
  if (!rows.length) throw { status: 400, message: 'Excel file does not contain any vehicle models' };

  const serviceLookup = await loadServiceLookup();
  const seenNames = new Set();
  const errors = [];
  const candidates = [];

  rows.forEach((row) => {
    const rowErrors = [];
    if (!row.name) rowErrors.push('name is required');
    if (!row.brand) rowErrors.push('brand is required');
    if (!row.service) rowErrors.push('serviceId or service name is required');

    const serviceId = resolveServiceId(row.service, serviceLookup);
    if (row.service && !serviceId) rowErrors.push('service does not match any existing service');

    const isActive = parseImportBoolean(row.isActive);
    const status = parseImportBoolean(row.status);
    if (isActive === null) rowErrors.push('isActive must be a boolean value');
    if (status === null) rowErrors.push('status must be a boolean value');

    const normalizedName = row.name.toLowerCase();
    if (row.name && seenNames.has(normalizedName)) rowErrors.push('duplicate name in uploaded file');

    if (rowErrors.length) {
      errors.push({ row: row.rowNumber, errors: rowErrors });
      return;
    }

    seenNames.add(normalizedName);
    candidates.push({
      row: row.rowNumber,
      data: {
        name: row.name,
        brand: row.brand,
        serviceId,
        ...normalizeStatusFields({ isActive, status }),
      },
    });
  });

  if (!candidates.length) {
    return { totalRows: rows.length, imported: 0, skipped: errors.length, errors };
  }

  const existingNames = await repo.findByNames(candidates.map(({ data }) => data.name));
  const existingNameSet = new Set(existingNames.map(({ name }) => name.toLowerCase()));
  const importable = [];

  candidates.forEach((candidate) => {
    if (existingNameSet.has(candidate.data.name.toLowerCase())) {
      errors.push({ row: candidate.row, errors: ['A vehicle model with this name already exists'] });
      return;
    }
    importable.push(candidate.data);
  });

  if (importable.length) await repo.createMany(importable);

  return {
    totalRows: rows.length,
    imported: importable.length,
    skipped: errors.length,
    errors,
  };
};

const updateModel = async (id, data) => {
  const model = await repo.findById(id);
  if (!model) throw { status: 404, message: 'Vehicle model not found' };
  if (data.serviceId !== undefined) await validateServiceExists(data.serviceId);
  const updateData = { ...data };
  if (data.isActive !== undefined || data.status !== undefined) {
    Object.assign(updateData, normalizeStatusFields({
      isActive: data.isActive ?? model.isActive,
      status: data.status ?? data.isActive ?? model.status,
    }));
  }
  return repo.update(id, updateData);
};

const deleteModel = async (id) => {
  const model = await repo.findById(id);
  if (!model) throw { status: 404, message: 'Vehicle model not found' };
  return repo.remove(id);
};

const getModelServices = async (modelId) => {
  const model = await repo.findById(modelId);
  if (!model) throw { status: 404, message: 'Vehicle model not found' };

  const prisma = require('../../config/prisma');
  return prisma.serviceVehicleModel.findMany({
    where: { vehicleModelId: modelId },
    include: { service: true },
    orderBy: { service: { name: 'asc' } },
  });
};

module.exports = { listModels, listActiveModels, getModel, getActiveModel, createModel, importModels, updateModel, deleteModel, getModelServices };
