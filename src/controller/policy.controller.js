const policyService = require('../service/policy.service');

async function searchByUsername(req, res, next) {
  try {
    const q = req.query.username;
    if (!q) return res.status(400).json({ error: 'username query param required' });
    const policies = await policyService.searchPoliciesByUsername(q);
    return res.json({ policies });
  } catch (err) {
    return next(err);
  }
}

async function aggregateByUser(req, res, next) {
  try {
    const agg = await policyService.aggregatePoliciesByUser();
    return res.json({ result: agg });
  } catch (err) {
    return next(err);
  }
}

module.exports = { searchByUsername, aggregateByUser };
