const jwt = require('jsonwebtoken');
const { users } = require('../models/mockData');

function login(req, res) {
  const role = req.body.role || 'student';
  const user = users.find((item) => item.role === role) || users[0];
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'borrow-equipment-secret',
    { expiresIn: '1d' }
  );

  res.json({
    ...user,
    email: req.body.email || user.email,
    token
  });
}

module.exports = {
  login
};
