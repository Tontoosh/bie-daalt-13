'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const request = require('supertest');
const app = require('../src/index');
const { setupTestDb, teardownTestDb, closeTestDb } = require('./helpers/mysqlTestHelper');

beforeAll(() => setupTestDb());
afterEach(() => teardownTestDb());
afterAll(() => closeTestDb());

describe('Users API', () => {
  const payload = { email: 'test@example.com', username: 'testuser', password: 'password123' };

  describe('POST /api/users/register', () => {
    it('registers a user', async () => {
      const res = await request(app).post('/api/users/register').send(payload);
      expect(res.status).toBe(201);
      expect(res.body.email).toBe(payload.email);
      expect(res.body.password_hash).toBeUndefined();
    });

    it('returns 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({ ...payload, email: 'bad' });
      expect(res.status).toBe(400);
    });

    it('returns 400 for short password', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({ ...payload, password: 'short' });
      expect(res.status).toBe(400);
    });

    it('returns 409 on duplicate email', async () => {
      await request(app).post('/api/users/register').send(payload);
      const res = await request(app).post('/api/users/register').send(payload);
      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/users/login', () => {
    it('returns user on valid credentials', async () => {
      await request(app).post('/api/users/register').send(payload);
      const res = await request(app)
        .post('/api/users/login')
        .send({ email: payload.email, password: payload.password });
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(payload.email);
    });

    it('returns 401 on wrong password', async () => {
      await request(app).post('/api/users/register').send(payload);
      const res = await request(app)
        .post('/api/users/login')
        .send({ email: payload.email, password: 'wrongpass' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('returns 404 for missing user', async () => {
      const res = await request(app).get('/api/users/99999');
      expect(res.status).toBe(404);
    });
  });
});
