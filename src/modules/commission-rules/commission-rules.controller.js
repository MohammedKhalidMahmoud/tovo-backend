const service = require('./commission-rules.service');
const { success, created, error, notFound } = require('../../utils/response');

const list = async (req, res, next) => {
  try {
    const rules = await service.listRules();
    return success(res, rules);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const rule = await service.getRuleById(req.params.id);
    return success(res, rule);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const rule = await service.createRule(req.body);
    return created(res, rule, 'Commission rule created');
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const rule = await service.updateRule(req.params.id, req.body);
    return success(res, rule, 'Commission rule updated');
  } catch (err) { next(err); }
};

const activate = async (req, res, next) => {
  try {
    const rule = await service.activateRule(req.params.id);
    return success(res, rule, 'Commission rule activated');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.deleteRule(req.params.id);
    return success(res, null, 'Commission rule deleted');
  } catch (err) { next(err); }
};

module.exports = { list, getOne, create, update, activate, remove };
