process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../src/app');
const { migrate } = require('../src/db/migrate');
const { db } = require('../src/db/database');

beforeAll(() => {
  migrate();
});

beforeEach(() => {
  db.exec('DELETE FROM users; DELETE FROM vehicles; DELETE FROM inventory_ledger;');
});

describe('POST /api/auth/register', () => {
  test('creates a new user and returns a JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'jane@example.com', password: 'Sup3rSecret!' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('jane@example.com');
    expect(res.body.user.role).toBe('USER');
  });

  test('rejects duplicate emails', async () => {
    await request(app).post('/api/auth/register').send({ email: 'dupe@example.com', password: 'Sup3rSecret!' });
    const res = await request(app).post('/api/auth/register').send({ email: 'dupe@example.com', password: 'Sup3rSecret!' });

    expect(res.status).toBe(409);
  });

  test('rejects an invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: 'Sup3rSecret!' });
    expect(res.status).toBe(400);
  });

  test('rejects a short password', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'short@example.com', password: '123' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({ email: 'login@example.com', password: 'Sup3rSecret!' });
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password: 'Sup3rSecret!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rejects incorrect password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password: 'WrongPassword!' });
    expect(res.status).toBe(401);
  });

  test('rejects unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'Sup3rSecret!' });
    expect(res.status).toBe(401);
  });
});
