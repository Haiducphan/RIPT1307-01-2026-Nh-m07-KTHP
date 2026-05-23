// login-dang nhap
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET || 'borrow-equipment-secret';

async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  let user;
  try {
    user = await User.findOne({ where: { email } });
  } catch (err) {
    console.error('User lookup error:', err.message);
    return res.status(500).json({ message: 'Database error' });
  }

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const fullName = user.fullName || user.email?.split('@')[0] || user.email;
  const token = jwt.sign(
    { id: user.id, role: user.role, fullName, email: user.email },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({
    id: user.id,
    fullName,
    email: user.email,
    role: user.role,
    token
  });
}

function me(req, res) {
  if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
  res.json(req.user);
}

module.exports = {
  login,
  me
};
