'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const request = require('supertest');
const app = require('../src/index');
const { setupTestDb, teardownTestDb, closeTestDb } = require('./helpers/mysqlTestHelper');

beforeAll(() => setupTestDb());
afterEach(() => teardownTestDb());
afterAll(() => closeTestDb());

async function createUser() {
  const res = await request(app)
    .post('/api/users/register')
    .send({ email: 'time@test.com', username: 'timeuser', password: 'password123' });
  return res.body;
}

describe('Time Entries API', () => {
  describe('GET /api/time', () => {
    it('returns empty list for new user', async () => {
      const user = await createUser();
      const res = await request(app).get(`/api/time?user_id=${user.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('POST /api/time', () => {
    it('creates a time entry', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/time')
        .send({
          userId: user.id,
          description: 'Work session',
          startedAt: '2026-05-12 09:00:00',
          endedAt: '2026-05-12 10:00:00',
        });
      expect(res.status).toBe(201);
      expect(res.body.description).toBe('Work session');
      expect(res.body.duration_s).toBe(3600);
    });

    it('returns 400 if startedAt missing', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/time')
        .send({ userId: user.id });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/time/start + PATCH /api/time/:id/stop', () => {
    it('starts and stops a timer', async () => {
      const user = await createUser();
      const start = await request(app)
        .post('/api/time/start')
        .send({ user_id: user.id, description: 'Timer' });
      expect(start.status).toBe(201);
      expect(start.body.id).toBeDefined();

      const stop = await request(app)
        .patch(`/api/time/${start.body.id}/stop`);
      expect(stop.status).toBe(200);
      expect(stop.body.ended_at).toBeDefined();
    });
  });

  describe('DELETE /api/time/:id', () => {
    it('deletes a time entry', async () => {
      const user = await createUser();
      const entry = await request(app)
        .post('/api/time')
        .send({
          userId: user.id,
          startedAt: '2026-05-12 10:00:00',
          endedAt: '2026-05-12 11:00:00',
        });
      const res = await request(app).delete(`/api/time/${entry.body.id}`);
      expect(res.status).toBe(204);
    });

    it('returns 404 for non-existent entry', async () => {
      const res = await request(app).delete('/api/time/99999');
      expect(res.status).toBe(404);
    });
  });
});
