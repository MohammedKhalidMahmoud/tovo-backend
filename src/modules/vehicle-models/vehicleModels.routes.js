const router  = require('express').Router();
const service = require('./vehicleModels.service');
const { success } = require('../../utils/response');

router.get('/', async (req, res, next) => {
  try {
    const models = await service.listModels(true); // only active
    return success(res, models, 'Vehicle models retrieved successfully');
  } catch (err) { next(err); }
});

module.exports = router;
