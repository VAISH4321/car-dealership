process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../src/app');
const { migrate } = require('../src/db/migrate');
const { db } = require('../src/db/database');

let userToken;
let adminToken;

async function registerAndLogin(email, role) {
  await request(app).post('/api/auth/register').send({ email, password: 'Sup3rSecret!', role });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Sup3rSecret!' });
  return res.body.token;
}

beforeAll(async () => {
  migrate();
});

beforeEach(async () => {
  db.exec('DELETE FROM users; DELETE FROM vehicles; DELETE FROM inventory_ledger;');
  userToken = await registerAndLogin('buyer@example.com', 'USER');
  adminToken = await registerAndLogin('boss@example.com', 'ADMIN');
});

function authed(req, token) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('Vehicle CRUD', () => {
  test('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/vehicles');
    expect(res.status).toBe(401);
  });

  test('admin can create a vehicle', async () => {
    const res = await authed(request(app).post('/api/vehicles'), adminToken).send({
      make: 'Porsche', model: 'Taycan 4S', year: 2025, category: 'EV', price: 95000, quantity: 3,
    });
    expect(res.status).toBe(201);
    expect(res.body.make).toBe('Porsche');
    expect(res.body.quantity).toBe(3);
  });

  test('a regular user cannot create a vehicle', async () => {
    const res = await authed(request(app).post('/api/vehicles'), userToken).send({
      make: 'Porsche', model: 'Taycan 4S', year: 2025, category: 'EV', price: 95000,
    });
    expect(res.status).toBe(403);
  });

  test('rejects a vehicle payload missing required fields', async () => {
    const res = await authed(request(app).post('/api/vehicles'), adminToken).send({ make: 'Porsche' });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('lists all vehicles for any authenticated user', async () => {
    await authed(request(app).post('/api/vehicles'), adminToken).send({
      make: 'Ford', model: 'F-150', year: 2023, category: 'TRUCK', price: 50000, quantity: 4,
    });
    const res = await authed(request(app).get('/api/vehicles'), userToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  test('admin can update a vehicle', async () => {
    const created = await authed(request(app).post('/api/vehicles'), adminToken).send({
      make: 'Ford', model: 'F-150', year: 2023, category: 'TRUCK', price: 50000, quantity: 4,
    });
    const res = await authed(request(app).put(`/api/vehicles/${created.body.id}`), adminToken).send({ price: 48999 });
    expect(res.status).toBe(200);
    expect(res.body.price).toBe(48999);
  });

  test('admin can delete a vehicle', async () => {
    const created = await authed(request(app).post('/api/vehicles'), adminToken).send({
      make: 'Ford', model: 'F-150', year: 2023, category: 'TRUCK', price: 50000, quantity: 4,
    });
    const del = await authed(request(app).delete(`/api/vehicles/${created.body.id}`), adminToken);
    expect(del.status).toBe(204);

    const getRes = await authed(request(app).get(`/api/vehicles/${created.body.id}`), userToken);
    expect(getRes.status).toBe(404);
  });

  test('a regular user cannot delete a vehicle', async () => {
    const created = await authed(request(app).post('/api/vehicles'), adminToken).send({
      make: 'Ford', model: 'F-150', year: 2023, category: 'TRUCK', price: 50000, quantity: 4,
    });
    const res = await authed(request(app).delete(`/api/vehicles/${created.body.id}`), userToken);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/vehicles/search', () => {
  beforeEach(async () => {
    await authed(request(app).post('/api/vehicles'), adminToken).send({
      make: 'Tesla', model: 'Model 3', year: 2025, category: 'EV', price: 38990, quantity: 6,
    });
    await authed(request(app).post('/api/vehicles'), adminToken).send({
      make: 'Ford', model: 'F-150', year: 2023, category: 'TRUCK', price: 52900, quantity: 4,
    });
    await authed(request(app).post('/api/vehicles'), adminToken).send({
      make: 'Honda', model: 'Civic', year: 2024, category: 'SEDAN', price: 24000, quantity: 0,
    });
  });

  test('filters by make', async () => {
    const res = await authed(request(app).get('/api/vehicles/search?make=ford'), userToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].make).toBe('Ford');
  });

  test('filters by category', async () => {
    const res = await authed(request(app).get('/api/vehicles/search?category=EV'), userToken);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].model).toBe('Model 3');
  });

  test('filters by price range', async () => {
    const res = await authed(request(app).get('/api/vehicles/search?minPrice=30000&maxPrice=60000'), userToken);
    expect(res.body.map((v) => v.make).sort()).toEqual(['Ford', 'Tesla']);
  });

  test('filters by in-stock only', async () => {
    const res = await authed(request(app).get('/api/vehicles/search?inStock=true'), userToken);
    expect(res.body.every((v) => v.quantity > 0)).toBe(true);
    expect(res.body).toHaveLength(2);
  });
});

describe('Purchase & restock (atomic inventory transactions)', () => {
  let vehicleId;

  beforeEach(async () => {
    const created = await authed(request(app).post('/api/vehicles'), adminToken).send({
      make: 'VW', model: 'GTI', year: 2023, category: 'HATCHBACK', price: 29750, quantity: 1,
    });
    vehicleId = created.body.id;
  });

  test('a user can purchase a vehicle, decrementing quantity', async () => {
    const res = await authed(request(app).post(`/api/vehicles/${vehicleId}/purchase`), userToken).send({});
    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(0);
  });

  test('purchase fails once stock is exhausted (no overselling)', async () => {
    await authed(request(app).post(`/api/vehicles/${vehicleId}/purchase`), userToken).send({});
    const res = await authed(request(app).post(`/api/vehicles/${vehicleId}/purchase`), userToken).send({});
    expect(res.status).toBe(409);
  });

  test('concurrent purchases never oversell a single unit of stock', async () => {
    // Fire two purchase requests "at the same time" against a vehicle
    // with only 1 unit in stock. Exactly one must succeed.
    const [a, b] = await Promise.all([
      authed(request(app).post(`/api/vehicles/${vehicleId}/purchase`), userToken).send({}),
      authed(request(app).post(`/api/vehicles/${vehicleId}/purchase`), userToken).send({}),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([200, 409]);
  });

  test('a regular user cannot restock', async () => {
    const res = await authed(request(app).post(`/api/vehicles/${vehicleId}/restock`), userToken).send({ amount: 5 });
    expect(res.status).toBe(403);
  });

  test('admin can restock, incrementing quantity', async () => {
    const res = await authed(request(app).post(`/api/vehicles/${vehicleId}/restock`), adminToken).send({ amount: 5 });
    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(6);
  });
});
