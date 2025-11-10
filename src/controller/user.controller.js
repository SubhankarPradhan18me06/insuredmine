const userService = require('../service/user.service');

async function getUser(req, res, next) {
  try {
    const id = req.params.id;
    const user = await userService.getUserById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
}

async function searchUsers(req, res, next) {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'q query param required' });
    const users = await userService.findUsersByName(q);
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getUser, searchUsers };
