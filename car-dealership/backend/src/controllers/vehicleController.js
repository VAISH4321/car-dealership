const Vehicle = require('../models/Vehicle');

const REQUIRED_FIELDS = ['make', 'model', 'year', 'category', 'price'];

function validateVehiclePayload(body, { partial = false } = {}) {
  const errors = [];
  if (!partial) {
    for (const field of REQUIRED_FIELDS) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        errors.push(`${field} is required.`);
      }
    }
  }
  if (body.price !== undefined && Number(body.price) < 0) {
    errors.push('price must be >= 0.');
  }
  if (body.quantity !== undefined && Number(body.quantity) < 0) {
    errors.push('quantity must be >= 0.');
  }
  return errors;
}

function listVehicles(req, res) {
  return res.json(Vehicle.findAll());
}

function searchVehicles(req, res) {
  const { make, model, category, minPrice, maxPrice, inStock } = req.query;
  const results = Vehicle.search({
    make, model, category, minPrice, maxPrice, inStockOnly: inStock,
  });
  return res.json(results);
}

function getVehicle(req, res) {
  const vehicle = Vehicle.findById(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });
  return res.json(vehicle);
}

function createVehicle(req, res) {
  const errors = validateVehiclePayload(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const vehicle = Vehicle.create(req.body);
  return res.status(201).json(vehicle);
}

function updateVehicle(req, res) {
  const errors = validateVehiclePayload(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ errors });

  const updated = Vehicle.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Vehicle not found.' });
  return res.json(updated);
}

function deleteVehicle(req, res) {
  const deleted = Vehicle.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Vehicle not found.' });
  return res.status(204).send();
}

function purchaseVehicle(req, res) {
  const amount = Number(req.body?.amount) || 1;
  if (amount <= 0) return res.status(400).json({ error: 'amount must be a positive integer.' });

  const vehicle = Vehicle.findById(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });

  const updated = Vehicle.purchase(req.params.id, req.user.id, amount);
  if (!updated) {
    return res.status(409).json({ error: 'Not enough stock available for this purchase.' });
  }
  return res.json(updated);
}

function restockVehicle(req, res) {
  const amount = Number(req.body?.amount) || 1;
  if (amount <= 0) return res.status(400).json({ error: 'amount must be a positive integer.' });

  const vehicle = Vehicle.findById(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });

  const updated = Vehicle.restock(req.params.id, req.user.id, amount);
  return res.json(updated);
}

module.exports = {
  listVehicles,
  searchVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  purchaseVehicle,
  restockVehicle,
};
