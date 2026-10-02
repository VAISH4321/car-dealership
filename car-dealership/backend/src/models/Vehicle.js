const { db } = require('../db/database');

const BASE_FIELDS = [
  'make', 'model', 'year', 'category', 'price', 'quantity',
  'description', 'fuel', 'gearbox', 'mileage', 'color', 'image_url',
];

const Vehicle = {
  findAll() {
    return db.prepare('SELECT * FROM vehicles ORDER BY created_at DESC').all();
  },

  findById(id) {
    return db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
  },

  /**
   * Flexible search supporting make / model / category (exact or partial)
   * and an inclusive price range. All filters are optional and combine
   * with AND semantics.
   */
  search({ make, model, category, minPrice, maxPrice, inStockOnly }) {
    const clauses = [];
    const params = {};

    if (make) {
      clauses.push('LOWER(make) LIKE LOWER(@make)');
      params.make = `%${make}%`;
    }
    if (model) {
      clauses.push('LOWER(model) LIKE LOWER(@model)');
      params.model = `%${model}%`;
    }
    if (category) {
      clauses.push('UPPER(category) = UPPER(@category)');
      params.category = category;
    }
    if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
      clauses.push('price >= @minPrice');
      params.minPrice = Number(minPrice);
    }
    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
      clauses.push('price <= @maxPrice');
      params.maxPrice = Number(maxPrice);
    }
    if (inStockOnly === true || inStockOnly === 'true') {
      clauses.push('quantity > 0');
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const sql = `SELECT * FROM vehicles ${where} ORDER BY created_at DESC`;
    return db.prepare(sql).all(params);
  },

  create(data) {
    const row = {
      make: data.make,
      model: data.model,
      year: data.year,
      category: data.category,
      price: data.price,
      quantity: data.quantity ?? 0,
      description: data.description ?? '',
      fuel: data.fuel ?? 'Gasoline',
      gearbox: data.gearbox ?? 'Automatic',
      mileage: data.mileage ?? 'Brand New',
      color: data.color ?? 'Standard',
      image_url: data.image_url ?? '',
    };
    const stmt = db.prepare(`
      INSERT INTO vehicles (make, model, year, category, price, quantity, description, fuel, gearbox, mileage, color, image_url)
      VALUES (@make, @model, @year, @category, @price, @quantity, @description, @fuel, @gearbox, @mileage, @color, @image_url)
    `);
    const info = stmt.run(row);
    return Vehicle.findById(info.lastInsertRowid);
  },

  update(id, data) {
    const existing = Vehicle.findById(id);
    if (!existing) return null;

    const merged = { ...existing };
    for (const field of BASE_FIELDS) {
      if (data[field] !== undefined) merged[field] = data[field];
    }

    db.prepare(`
      UPDATE vehicles SET
        make = @make, model = @model, year = @year, category = @category,
        price = @price, quantity = @quantity, description = @description,
        fuel = @fuel, gearbox = @gearbox, mileage = @mileage, color = @color,
        image_url = @image_url,
        updated_at = datetime('now')
      WHERE id = @id
    `).run({ ...merged, id });

    return Vehicle.findById(id);
  },

  delete(id) {
    const info = db.prepare('DELETE FROM vehicles WHERE id = ?').run(id);
    return info.changes > 0;
  },

  /**
   * Atomically decrements quantity by 1 (or `amount`) if — and only if —
   * enough stock is available. Returns the updated vehicle, or null if
   * the vehicle doesn't exist or there isn't enough stock (no partial
   * writes ever happen: this runs as a single conditional UPDATE).
   */
  purchase(id, userId, amount = 1, orderId = null) {
    const txn = db.transaction((vehicleId, qty) => {
      const result = db.prepare(
        'UPDATE vehicles SET quantity = quantity - ?, updated_at = datetime(\'now\') WHERE id = ? AND quantity >= ?'
      ).run(qty, vehicleId, qty);

      if (result.changes === 0) {
        return null; // either vehicle missing or not enough stock
      }

      db.prepare(
        'INSERT INTO inventory_ledger (vehicle_id, user_id, order_id, change, reason) VALUES (?, ?, ?, ?, ?)'
      ).run(vehicleId, userId, orderId, -qty, 'PURCHASE');

      return Vehicle.findById(vehicleId);
    });

    return txn(id, amount);
  },

  /**
   * Atomically increments quantity. Admin-only at the route level.
   */
  restock(id, userId, amount = 1) {
    const txn = db.transaction((vehicleId, qty) => {
      const result = db.prepare(
        'UPDATE vehicles SET quantity = quantity + ?, updated_at = datetime(\'now\') WHERE id = ?'
      ).run(qty, vehicleId);

      if (result.changes === 0) return null;

      db.prepare(
        'INSERT INTO inventory_ledger (vehicle_id, user_id, change, reason) VALUES (?, ?, ?, ?)'
      ).run(vehicleId, userId, qty, 'RESTOCK');

      return Vehicle.findById(vehicleId);
    });

    return txn(id, amount);
  },
};

module.exports = Vehicle;
