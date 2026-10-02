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

async function placeOrder(quantity = 1) {
  const v = await authed(request(app).post('/api/vehicles'), adminToken).send({
    make: 'Tesla', model: 'Model 3', year: 2025, category: 'EV', price: 38990, quantity: 5,
  });
  const order = await authed(request(app).post('/api/orders'), userToken).send({
    buyer,
    items: [{ vehicleId: v.body.id, quantity }],
  });
  return { vehicle: v.body, order: order.body };
}

describe('PATCH /api/orders/:id/status', () => {
  test('walks an order through CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED', async () => {
    const { order } = await placeOrder();

    const accepted = await authed(request(app).patch(`/api/orders/${order.id}/status`), adminToken).send({ status: 'PROCESSING' });
    expect(accepted.status).toBe(200);
    expect(accepted.body.status).toBe('PROCESSING');

    const shipped = await authed(request(app).patch(`/api/orders/${order.id}/status`), adminToken).send({ status: 'SHIPPED' });
    expect(shipped.status).toBe(200);
    expect(shipped.body.status).toBe('SHIPPED');

    const delivered = await authed(request(app).patch(`/api/orders/${order.id}/status`), adminToken).send({ status: 'DELIVERED' });
    expect(delivered.status).toBe(200);
    expect(delivered.body.status).toBe('DELIVERED');
  });

  test('rejects a non-admin trying to update order status', async () => {
    const { order } = await placeOrder();
    const res = await authed(request(app).patch(`/api/orders/${order.id}/status`), userToken).send({ status: 'PROCESSING' });
    expect(res.status).toBe(403);
  });

  test('rejects skipping a step in the lifecycle', async () => {
    const { order } = await placeOrder();
    const res = await authed(request(app).patch(`/api/orders/${order.id}/status`), adminToken).send({ status: 'SHIPPED' });
    expect(res.status).toBe(409);
  });

  test('rejects an unknown status value', async () => {
    const { order } = await placeOrder();
    const res = await authed(request(app).patch(`/api/orders/${order.id}/status`), adminToken).send({ status: 'TELEPORTED' });
    expect(res.status).toBe(400);
  });

  test('cancelling an order restocks its vehicles', async () => {
    const { vehicle, order } = await placeOrder(2);

    const beforeCancel = await authed(request(app).get(`/api/vehicles/${vehicle.id}`), adminToken);
    expect(beforeCancel.body.quantity).toBe(3); // 5 - 2 reserved at checkout

    const cancelled = await authed(request(app).patch(`/api/orders/${order.id}/status`), adminToken).send({ status: 'CANCELLED' });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe('CANCELLED');

    const afterCancel = await authed(request(app).get(`/api/vehicles/${vehicle.id}`), adminToken);
    expect(afterCancel.body.quantity).toBe(5); // restocked
  });

  test('cannot cancel an order that has already shipped', async () => {
    const { order } = await placeOrder();
    await authed(request(app).patch(`/api/orders/${order.id}/status`), adminToken).send({ status: 'PROCESSING' });
    await authed(request(app).patch(`/api/orders/${order.id}/status`), adminToken).send({ status: 'SHIPPED' });

    const res = await authed(request(app).patch(`/api/orders/${order.id}/status`), adminToken).send({ status: 'CANCELLED' });
    expect(res.status).toBe(409);
  });

  test('returns 404 for a non-existent order', async () => {
    const res = await authed(request(app).patch('/api/orders/999999/status'), adminToken).send({ status: 'PROCESSING' });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/orders/:id/cancel (customer self-service cancellation)', () => {
  test('a customer can cancel their own order while it is CONFIRMED', async () => {
    const { vehicle, order } = await placeOrder(2);

    const res = await authed(request(app).post(`/api/orders/${order.id}/cancel`), userToken).send({});
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');

    const vehicleAfter = await authed(request(app).get(`/api/vehicles/${vehicle.id}`), userToken);
    expect(vehicleAfter.body.quantity).toBe(5); // restocked
  });

  test('a customer can still cancel while an admin is PROCESSING the order', async () => {
    const { order } = await placeOrder();
    await authed(request(app).patch(`/api/orders/${order.id}/status`), adminToken).send({ status: 'PROCESSING' });

    const res = await authed(request(app).post(`/api/orders/${order.id}/cancel`), userToken).send({});
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
  });

  test('a customer CANNOT cancel once the order has shipped', async () => {
    const { order } = await placeOrder();
    await authed(request(app).patch(`/api/orders/${order.id}/status`), adminToken).send({ status: 'PROCESSING' });
    await authed(request(app).patch(`/api/orders/${order.id}/status`), adminToken).send({ status: 'SHIPPED' });

    const res = await authed(request(app).post(`/api/orders/${order.id}/cancel`), userToken).send({});
    expect(res.status).toBe(409);

    const check = await authed(request(app).get(`/api/orders/${order.id}`), userToken);
    expect(check.body.status).toBe('SHIPPED');
  });

  test('a customer cannot cancel someone else\'s order', async () => {
    const other = await registerAndLogin('rando@example.com', 'USER');
    const { order } = await placeOrder();

    const res = await authed(request(app).post(`/api/orders/${order.id}/cancel`), other).send({});
    expect(res.status).toBe(403);
  });

  test('an admin can also cancel via the self-service endpoint', async () => {
    const { order } = await placeOrder();
    const res = await authed(request(app).post(`/api/orders/${order.id}/cancel`), adminToken).send({});
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
  });
});
