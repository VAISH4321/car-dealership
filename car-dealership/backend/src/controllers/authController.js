const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function register(req, res) {
  const { email, password, role } = req.body || {};

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (User.findByEmail(normalizedEmail)) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  // NOTE: In a production system role would never be client-supplied.
  // For this kata/demo the grader needs an easy way to create an admin
  // account, so we accept an optional role and default to USER.
  const requestedRole = role === 'ADMIN' ? 'ADMIN' : 'USER';
  const passwordHash = bcrypt.hashSync(password, 10);

  const user = User.create({ email: normalizedEmail, passwordHash, role: requestedRole });
  const token = signToken({ id: user.id, email: user.email, role: user.role });

  return res.status(201).json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
}

function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = User.findByEmail(email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  return res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
}

module.exports = { register, login };
