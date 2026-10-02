const { db } = require('../db/database');

const User = {
  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  findById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  create({ email, passwordHash, role }) {
    const stmt = db.prepare(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)'
    );
    const info = stmt.run(email, passwordHash, role);
    return User.findById(info.lastInsertRowid);
  },
};

module.exports = User;
