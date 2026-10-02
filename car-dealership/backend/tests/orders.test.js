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

function authed(req, token) {
  return req.set('Authorization', `Bearer ${token}`);
}

beforeAll(() => {
  migrate();
});

beforeEach(async () => {
  db.exec('DELETE FROM users; DELETE FROM vehicles; DELETE FROM inventory_ledger; DELETE FROM orders; DELETE FROM order_items;');
  userToken = await registerAndLogin('shopper@example.com', 'USER');
  adminToken = await registerAndLogin('boss@example.com', 'ADMIN');
});

const buyer = { name: 'Jane Doe', phone: '+1 555-123-4567', address: '123 Main St, Springfield' };

describe('POST /api/orders (checkout)', () => {
  test('places an order for a single vehicle and decrements stock', async () => {
    const v = await authed(request(app).post('/api/vehicles'), adminToken).send({
      make: 'Tesla', model: 'Model 3', year: 2025, category: 'EV', price: 38990, quantity: 5,
    });

    const res = await authed(request(app).post('/api/orders'), userToken).send({
      buyer,
      items: [{ vehicleId: v.body.id, quantity: 2 }],
    });

    expect(res.status).toBe(201);
    expect(res.body.total_amount).toBe(38990 * 2);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.status).toBe('CONFIRMED');

    const vehicleRes = await authed(request(app).get(`/api/vehicles/${v.body.id}`), userToken);
    expect(vehicleRes.body.quantity).toBe(3);
  });

  test('places a multi-item cart order across several vehicles', async () => {
    const v1 = await authed(request(app).post('/api/vehicles'), adminToken).send({
      make: 'Ford', model: 'F-150', year: 2023, category: 'TRUCK', price: 50000, quantity: 3,
    });
    const v2 = await authed(request(app).post('/api/vehicles'), adminToken).send({
      make: 'Honda', model: 'Civic', year: 2024, category: 'SEDAN', price: 24000, quantity: 3,
    });

    const res = await authed(request(app).post('/api/orders'), userToken).send({
      buyer,
      items: [
        { vehicleId: v1.body.id, quantity: 1 },
        { vehicleId: v2.body.id, quantity: 2 },
      ],
    });

    expect(res.status).toBe(201);
    expect(res.body.total_amount).toBe(50000 + 24000 * 2);
    expect(res.body.items).toHaveLength(2);
  });

  test('rejects checkout when buyer details are missing', async () => {
    const v = await authed(request(app).post('/api/vehicles'), adminToken).send({
      make: 'Tesla', model: 'Model 3', year: 2025, category: 'EV', price: 38990, quantity: 5,
    });
    const res = await authed(request(app).post('/api/orders'), userToken).send({
      buyer: { name: '', phone: '', address: '' },
      items: [{ vehicleId: v.body.id, quantity: 1 }],
    });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('an entire multi-item order rolls back if one item has insufficient stock', async () => {
    const v1 = await authed(request(app).post('/api/vehicles'), adminToken).send({
      make: 'Ford', model: 'F-150', year: 2023, category: 'TRUCK', price: 50000, quantity: 5,
    });
    const v2 = await authed(request(app).post('/api/vehicles'), adminToken).send({
      make: 'Rare', model: 'OneOff', year: 2024, category: 'COUPE', price: 100000, quantity: 1,
    });

    const res = await authed(request(app).post('/api/orders'), userToken).send({
      buyer,
      items: [
        { vehicleId: v1.body.id, quantity: 2 },   // plenty of stock
        { vehicleId: v2.body.id, quantity: 5 },   // not enough stock -> should fail whole order
      ],
    });

    expect(res.status).toBe(409);

    // v1's stock must NOT have been touched, proving the transaction rolled back.
    const v1After = await authed(request(app).get(`/api/vehicles/${v1.body.id}`), userToken);
    expect(v1After.body.quantity).toBe(5);

    const ordersAfter = await authed(request(app).get('/api/orders'), userToken);
    expect(ordersAfter.body).toHaveLength(0);
  });

  test('rejects checkout for a vehicle that does not exist', async () => {
    const res = await authed(request(app).post('/api/orders'), userToken).send({
      buyer,
      items: [{ vehicleId: 999999, quantity: 1 }],
    });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/orders', () => {
  test('a user only sees their own orders', async () => {
    const other = await registerAndLogin('other@example.com', 'USER');
    const v = await authed(request(app).post('/api/vehicles'), adminToken).send({
      make: 'Tesla', model: 'Model 3', year: 2025, category: 'EV', price: 38990, quantity: 5,
    });

    await authed(request(app).post('/api/orders'), userToken).send({ buyer, items: [{ vehicleId: v.body.id, quantity: 1 }] });
    await authed(request(app).post('/api/orders'), other).send({ buyer, items: [{ vehicleId: v.body.id, quantity: 1 }] });

    const res = await authed(request(app).get('/api/orders'), userToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  test('an admin sees every order', async () => {
    const v = await authed(request(app).post('/api/vehicles'), adminToken).send({
      make: 'Tesla', model: 'Model 3', year: 2025, category: 'EV', price: 38990, quantity: 5,
    });
    await authed(request(app).post('/api/orders'), userToken).send({ buyer, items: [{ vehicleId: v.body.id, quantity: 1 }] });

    const res = await authed(request(app).get('/api/orders'), adminToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].buyer_email).toBe('shopper@example.com');
  });

  test('a user cannot fetch another user\'s single order by id', async () => {
    const other = await registerAndLogin('rando@example.com', 'USER');
    const v = await authed(request(app).post('/api/vehicles'), adminToken).send({
      make: 'Tesla', model: 'Model 3', year: 2025, category: 'EV', price: 38990, quantity: 5,
    });
    const order = await authed(request(app).post('/api/orders'), userToken).send({ buyer, items: [{ vehicleId: v.body.id, quantity: 1 }] });

    const res = await authed(request(app).get(`/api/orders/${order.body.id}`), other);
    expect(res.status).toBe(403);
  });
});
