const User = require('../model/user.model');

async function getUserById(id) {
  return User.findById(id).lean();
}

async function findUsersByName(q) {
  return User.find({ firstName: { $regex: q, $options: 'i' } }).lean();
}

module.exports = { getUserById, findUsersByName };
