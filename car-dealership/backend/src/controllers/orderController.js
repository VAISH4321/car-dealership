const { Order, InsufficientStockError, InvalidTransitionError, ALLOWED_TRANSITIONS } = require('../models/Order');
const Vehicle = require('../models/Vehicle');

const VALID_STATUSES = Object.keys(ALLOWED_TRANSITIONS);

const PHONE_RE = /^[\d\s()+-]{7,20}$/;

function validateCheckout(body) {
  const errors = [];
  const buyer = body.buyer || {};
  const items = body.items || [];

  if (!buyer.name || !buyer.name.trim()) errors.push('buyer.name is required.');
  if (!buyer.phone || !PHONE_RE.test(buyer.phone)) errors.push('buyer.phone must be a valid phone number.');
  if (!buyer.address || !buyer.address.trim()) errors.push('buyer.address is required.');
  if (!Array.isArray(items) || items.length === 0) errors.push('items must be a non-empty array.');

  items.forEach((item, idx) => {
    if (!item.vehicleId) errors.push(`items[${idx}].vehicleId is required.`);
    if (!item.quantity || Number(item.quantity) <= 0) errors.push(`items[${idx}].quantity must be a positive integer.`);
  });

  return errors;
}

function createOrder(req, res) {
  const errors = validateCheckout(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const { buyer, items } = req.body;

  // Pre-check every vehicle exists before touching the transaction, so
  // we can return a clear 404 instead of a generic 409 when the cart
  // references a vehicle that's been deleted since it was added.
  for (const item of items) {
    if (!Vehicle.findById(item.vehicleId)) {
      return res.status(404).json({ error: `Vehicle ${item.vehicleId} not found.` });
    }
  }

  try {
    const order = Order.create(req.user.id, buyer, items.map((i) => ({
      vehicleId: i.vehicleId,
      quantity: Number(i.quantity),
    })));
    return res.status(201).json(order);
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return res.status(409).json({
        error: 'One or more items in your cart no longer have enough stock. Your order was not placed.',
        vehicleId: err.vehicleId,
      });
    }
    throw err;
  }
}

function listOrders(req, res) {
  const orders = req.user.role === 'ADMIN' ? Order.findAll() : Order.findByUser(req.user.id);
  return res.json(orders);
}

function getOrder(req, res) {
  const order = Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (req.user.role !== 'ADMIN' && order.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You do not have access to this order.' });
  }
  return res.json(order);
}

// Admin-only: move an order forward through its lifecycle (accept /
// ship / deliver) or cancel it. Restocking on cancellation is handled
// atomically inside Order.updateStatus.
function updateOrderStatus(req, res) {
  const { status } = req.body || {};

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}.` });
  }

  const existing = Order.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Order not found.' });

  try {
    const updated = Order.updateStatus(req.params.id, status, req.user.id);
    return res.json(updated);
  } catch (err) {
    if (err instanceof InvalidTransitionError) {
      return res.status(409).json({ error: err.message });
    }
    throw err;
  }
}

// Customer self-service cancellation. A shopper may cancel their own
// order only while it's still CONFIRMED or PROCESSING — i.e. before it
// has shipped. Once SHIPPED/DELIVERED, only staff intervention (returns,
// refusal at delivery, etc.) applies, so we intentionally don't expose
// cancellation past that point. Admins may also use this endpoint on
// any order they can already manage via updateOrderStatus.
function cancelOrder(req, res) {
  const existing = Order.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Order not found.' });

  if (req.user.role !== 'ADMIN' && existing.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You do not have access to this order.' });
  }

  if (!['CONFIRMED', 'PROCESSING'].includes(existing.status)) {
    return res.status(409).json({
      error: 'This order has already shipped and can no longer be cancelled. Please contact support.',
    });
  }

  const updated = Order.updateStatus(req.params.id, 'CANCELLED', req.user.id);
  return res.json(updated);
}

module.exports = { createOrder, listOrders, getOrder, updateOrderStatus, cancelOrder };
