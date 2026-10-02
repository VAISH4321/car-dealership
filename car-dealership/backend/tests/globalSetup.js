const fs = require('fs');
const path = require('path');

module.exports = async function globalSetup() {
  process.env.NODE_ENV = 'test';
  const dbPath = path.join(__dirname, '..', 'data', 'test.db');
  for (const suffix of ['', '-wal', '-shm']) {
    const p = dbPath + suffix;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
};
