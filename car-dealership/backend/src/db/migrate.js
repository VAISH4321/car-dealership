const { db } = require('./database');

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL CHECK (price >= 0),
      quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
      description TEXT DEFAULT '',
      fuel TEXT DEFAULT 'Gasoline',
      gearbox TEXT DEFAULT 'Automatic',
      mileage TEXT DEFAULT 'Brand New',
      color TEXT DEFAULT 'Standard',
      image_url TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inventory_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      change INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
      buyer_name TEXT NOT NULL,
      buyer_phone TEXT NOT NULL,
      buyer_address TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'CARD',
      notes TEXT DEFAULT '',
      total_amount REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL
    );
  `);

  // --- Lightweight forward migrations for databases created before this
  // column existed (ALTER TABLE ADD COLUMN is safe/idempotent here since
  // we guard it with a column-existence check). CREATE TABLE IF NOT
  // EXISTS above won't retrofit columns onto an already-created table.
  const vehicleColumns = db.prepare("PRAGMA table_info(vehicles)").all().map((c) => c.name);
  if (!vehicleColumns.includes('image_url')) {
    db.exec("ALTER TABLE vehicles ADD COLUMN image_url TEXT DEFAULT ''");
  }

  console.log(`Migration complete.`);
}

if (require.main === module) {
  migrate();
}

module.exports = { migrate };
