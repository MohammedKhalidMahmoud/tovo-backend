const repo = require('./commission-rules.repository');

const VALID_TYPES = ['fixed_amount', 'percentage', 'tiered_fixed', 'tiered_percentage'];
const COMMISSION_PCT = Number(process.env.COMMISSION_PCT) || 15;

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIG VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
const validateConfig = (type, config) => {
  if (type === 'percentage') {
    if (typeof config !== 'object' || Array.isArray(config) || typeof config.pct !== 'number') {
      throw Object.assign(new Error('percentage config must be { "pct": <number> }'), { statusCode: 400 });
    }
    return;
  }

  if (['fixed_amount', 'tiered_fixed', 'tiered_percentage'].includes(type)) {
    if (!Array.isArray(config) || config.length === 0) {
      throw Object.assign(new Error(`${type} config must be a non-empty array of brackets`), { statusCode: 400 });
    }
    for (const bracket of config) {
      if (typeof bracket.minFare !== 'number') {
        throw Object.assign(new Error('Each bracket must have a numeric minFare'), { statusCode: 400 });
      }
      if (bracket.maxFare !== null && typeof bracket.maxFare !== 'number') {
        throw Object.assign(new Error('bracket.maxFare must be a number or null'), { statusCode: 400 });
      }
      if (type === 'tiered_percentage' && typeof bracket.pct !== 'number') {
        throw Object.assign(new Error('tiered_percentage brackets must have a numeric pct'), { statusCode: 400 });
      }
      if (['fixed_amount', 'tiered_fixed'].includes(type) && typeof bracket.amount !== 'number') {
        throw Object.assign(new Error('fixed_amount/tiered_fixed brackets must have a numeric amount'), { statusCode: 400 });
      }
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  RULE EVALUATION
// ─────────────────────────────────────────────────────────────────────────────
const evaluateRule = (rule, baseAmount) => {
  const { type, config } = rule;

  if (type === 'percentage') {
    return +(baseAmount * config.pct / 100).toFixed(2);
  }

  // bracket-based types
  const bracket = config.find(
    (b) => baseAmount >= b.minFare && (b.maxFare === null || baseAmount <= b.maxFare)
  );
  if (!bracket) {
    throw Object.assign(
      new Error('No matching commission bracket found for amount: ' + baseAmount),
      { statusCode: 422 }
    );
  }

  if (type === 'tiered_percentage') {
    return +(baseAmount * bracket.pct / 100).toFixed(2);
  }

  // fixed_amount | tiered_fixed
  return +Number(bracket.amount).toFixed(2);
};

// ─────────────────────────────────────────────────────────────────────────────
//  CALCULATE COMMISSION  (called by trips.service.js)
// ─────────────────────────────────────────────────────────────────────────────
// baseAmount = driverEarnings (what the driver earns before commission).
// Returns commission to add on top. Caller computes: fare = baseAmount + commission.
const calculateCommission = async (baseAmount, serviceId) => {
  const rule = await repo.findActiveRule(serviceId);

  let commission;
  if (!rule) {
    // Fallback to env var
    commission = +(baseAmount * COMMISSION_PCT / 100).toFixed(2);
  } else {
    commission = evaluateRule(rule, baseAmount);
  }

  // Clamp to >= 0
  commission = Math.max(0, commission);

  return { commission };
};

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN CRUD
// ─────────────────────────────────────────────────────────────────────────────
const listRules = () => repo.findAll();

const getRuleById = async (id) => {
  const rule = await repo.findById(id);
  if (!rule) throw Object.assign(new Error('Commission rule not found'), { statusCode: 404 });
  return rule;
};

const createRule = (data) => {
  const { name, type, serviceId, config } = data;
  if (!VALID_TYPES.includes(type)) {
    throw Object.assign(new Error(`type must be one of: ${VALID_TYPES.join(', ')}`), { statusCode: 400 });
  }
  validateConfig(type, config);
  // status is never set from request — schema default (false) applies
  return repo.create({ name, type, serviceId: serviceId ?? null, config });
};

const updateRule = async (id, data) => {
  const rule = await repo.findById(id);
  if (!rule) throw Object.assign(new Error('Commission rule not found'), { statusCode: 404 });

  const { name, type, serviceId, config } = data;
  const resolvedType = type ?? rule.type;
  const resolvedConfig = config ?? rule.config;

  if (type || config) {
    validateConfig(resolvedType, resolvedConfig);
  }

  const updateData = {};
  if (name !== undefined)      updateData.name      = name;
  if (type !== undefined)      updateData.type      = type;
  if (serviceId !== undefined) updateData.serviceId = serviceId;
  if (config !== undefined)    updateData.config    = config;

  return repo.update(id, updateData);
};

const activateRule = async (id) => {
  const rule = await repo.findById(id);
  if (!rule) throw Object.assign(new Error('Commission rule not found'), { statusCode: 404 });

  const [, activated] = await repo.activateRule(id, rule.serviceId);
  return activated;
};

const deleteRule = async (id) => {
  const rule = await repo.findById(id);
  if (!rule) throw Object.assign(new Error('Commission rule not found'), { statusCode: 404 });
  await repo.remove(id);
};

module.exports = { calculateCommission, listRules, getRuleById, createRule, updateRule, activateRule, deleteRule };
