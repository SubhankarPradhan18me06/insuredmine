const Policy = require('../model/policy.model');
const User = require('../model/user.model');

/**
 * Return policies for users matching a username (firstName or email, case-insensitive).
 * @param {string} username
 * @returns {Promise<Array>}
 */
async function searchPoliciesByUsername(username) {
  if (!username) return [];

  // Find users that match either firstName or email
  const users = await User.find({
    $or: [
      { firstName: { $regex: username, $options: 'i' } },
      { email: { $regex: username, $options: 'i' } }
    ]
  }).lean();

  if (!users.length) return [];

  const userIds = users.map(u => u._id);

  // Fetch policies for those users and populate related refs
  const policies = await Policy.find({ user: { $in: userIds } })
    .populate('agent lob carrier account user') // consider projecting fields for perf
    .lean();

  return policies;
}

/**
 * Aggregate policies grouped by user: policyCount and policy list
 * @returns {Promise<Array>}
 */
async function aggregatePoliciesByUser() {
  const agg = await Policy.aggregate([
    {
      $group: {
        _id: '$user',
        policyCount: { $sum: 1 },
        policies: { $push: '$$ROOT' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        user: { firstName: '$user.firstName', email: '$user.email', phone: '$user.phone' },
        policyCount: 1,
        policies: 1
      }
    }
  ]).allowDiskUse(true);

  return agg;
}

module.exports = {
  searchPoliciesByUsername,
  aggregatePoliciesByUser
};
