// login-dang nhap
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { users } = require('../models/mockData');
const User = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET || 'borrow-equipment-secret';

async function login(req, res) {
  const { email, role, password } = req.body || {};

  let user = null;

  try {
    if (email) {
      const dbUser = await User.findOne({ where: { email } });
      if (dbUser) user = dbUser.dataValues || dbUser;
    }

    if (!user && role) {
      const dbUser = await User.findOne({ where: { role } });
      if (dbUser) user = dbUser.dataValues || dbUser;
    }
  } catch (err) {
    // DB lookup failed — fall back to mock data below
    console.error('User lookup error:', err.message);
  }

  // If not found in DB, fallback to mock data
  if (!user) {
    if (email) {
      user = users.find((u) => u.email === email);
    }
    if (!user && role) {
      user = users.find((u) => u.role === role);
    }
  }

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Compare provided password with stored bcrypt hash
  if (!password || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, fullName: user.fullName, email: user.email },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({
    id: user.id,
    fullName: user.fullName,
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
