const { db } = require('../db/database');
const Vehicle = require('./Vehicle');

class InsufficientStockError extends Error {
  constructor(vehicleId) {
    super(`Not enough stock for vehicle ${vehicleId}.`);
    this.name = 'InsufficientStockError';
    this.vehicleId = vehicleId;
  }
}

class InvalidTransitionError extends Error {
  constructor(from, to) {
    super(`Cannot move an order from ${from} to ${to}.`);
    this.name = 'InvalidTransitionError';
  }
}

// The lifecycle every order moves through once it's placed. CONFIRMED
// is the starting state (stock is already reserved at that point).
// An admin works it forward one step at a time, or cancels it while
// it's still CONFIRMED or PROCESSING (before it has shipped).
const ALLOWED_TRANSITIONS = {
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

const Order = {
  /**
   * Places an order for one or more vehicles in a single atomic
   * transaction: either every line item successfully decrements its
   * vehicle's stock and the order + order_items rows are written, or
   * NOTHING is written (e.g. one vehicle in the cart sold out to
   * someone else a moment ago). This prevents a cart checkout from
   * partially succeeding.
   *
   * @param {number} userId
   * @param {{name:string, phone:string, address:string, paymentMethod:string, notes?:string}} buyer
   * @param {{vehicleId:number, quantity:number}[]} items
   */
  create(userId, buyer, items) {
    const txn = db.transaction(() => {
      const orderInsert = db.prepare(`
        INSERT INTO orders (user_id, buyer_name, buyer_phone, buyer_address, payment_method, notes, total_amount)
        VALUES (@userId, @name, @phone, @address, @paymentMethod, @notes, 0)
      `).run({
        userId,
        name: buyer.name,
        phone: buyer.phone,
        address: buyer.address,
        paymentMethod: buyer.paymentMethod || 'CARD',
        notes: buyer.notes || '',
      });

      const orderId = orderInsert.lastInsertRowid;
      let total = 0;

      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, vehicle_id, make, model, unit_price, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        const vehicleBefore = Vehicle.findById(item.vehicleId);
        if (!vehicleBefore) {
          throw new InsufficientStockError(item.vehicleId);
        }

        // Vehicle.purchase is itself atomic (conditional UPDATE); if it
        // returns null there wasn't enough stock, and throwing here
        // rolls back the whole order transaction, including any
        // vehicles already decremented earlier in this same loop.
        const updated = Vehicle.purchase(item.vehicleId, userId, item.quantity, orderId);
        if (!updated) {
          throw new InsufficientStockError(item.vehicleId);
        }

        insertItem.run(orderId, vehicleBefore.id, vehicleBefore.make, vehicleBefore.model, vehicleBefore.price, item.quantity);
        total += vehicleBefore.price * item.quantity;
      }

      db.prepare('UPDATE orders SET total_amount = ? WHERE id = ?').run(total, orderId);

      return Order.findById(orderId);
    });

    return txn();
  },

  findById(id) {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) return null;
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
    return order;
  },

  findByUser(userId) {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    return orders.map((o) => ({
      ...o,
      items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id),
    }));
  },

  findAll() {
    const orders = db.prepare(`
      SELECT orders.*, users.email AS buyer_email
      FROM orders JOIN users ON users.id = orders.user_id
      ORDER BY orders.created_at DESC
    `).all();
    return orders.map((o) => ({
      ...o,
      items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id),
    }));
  },

  /**
   * Moves an order to a new status, enforcing the lifecycle in
   * ALLOWED_TRANSITIONS. Cancelling an order restocks every vehicle in
   * it (atomically, alongside the status change) since the stock was
   * reserved the moment the order was placed.
   */
  updateStatus(id, nextStatus, adminUserId) {
    const txn = db.transaction(() => {
      const order = Order.findById(id);
      if (!order) return null;

      const allowed = ALLOWED_TRANSITIONS[order.status] || [];
      if (!allowed.includes(nextStatus)) {
        throw new InvalidTransitionError(order.status, nextStatus);
      }

      if (nextStatus === 'CANCELLED') {
        for (const item of order.items) {
          Vehicle.restock(item.vehicle_id, adminUserId, item.quantity);
        }
      }

      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(nextStatus, id);
      return Order.findById(id);
    });

    return txn();
  },
};

module.exports = { Order, InsufficientStockError, InvalidTransitionError, ALLOWED_TRANSITIONS };
