const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Use a dedicated test database when running the Jest suite so we never
// touch (or wipe) real development data.
const isTest = process.env.NODE_ENV === 'test';

const dbPath = isTest
  ? path.join(__dirname, '..', '..', 'data', 'test.db')
  : path.resolve(process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'dealership.db'));

const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = { db, dbPath };
