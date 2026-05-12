'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const request = require('supertest');
const app = require('../src/index');
const { setupTestDb, teardownTestDb, closeTestDb } = require('./helpers/mysqlTestHelper');
const { getPool } = require('../src/db/database');

beforeAll(() => setupTestDb());
afterEach(() => teardownTestDb());
afterAll(() => closeTestDb());

async function createUser() {
  const res = await request(app)
    .post('/api/users/register')
    .send({ email: 'notif@test.com', username: 'notifuser', password: 'password123' });
  return res.body;
}

async function seedNotification(userId) {
  const pool = getPool();
  const [result] = await pool.execute(
    `INSERT INTO notifications (user_id, type, title, body, is_read) VALUES (?, 'info', 'Test Notification', 'Body text', 0)`,
    [userId]
  );
  return result.insertId;
}

describe('Notifications API', () => {
  describe('GET /api/notifications', () => {
    it('returns empty list for user with no notifications', async () => {
      const user = await createUser();
      const res = await request(app).get(`/api/notifications?user_id=${user.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns notifications for user', async () => {
      const user = await createUser();
      await seedNotification(user.id);
      const res = await request(app).get(`/api/notifications?user_id=${user.id}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Test Notification');
    });
  });

  describe('GET /api/notifications/count', () => {
    it('returns count of unread notifications', async () => {
      const user = await createUser();
      await seedNotification(user.id);
      const res = await request(app).get(`/api/notifications/count?user_id=${user.id}`);
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
    });

    it('returns 0 when no unread notifications', async () => {
      const user = await createUser();
      const res = await request(app).get(`/api/notifications/count?user_id=${user.id}`);
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('marks notification as read', async () => {
      const user = await createUser();
      const notifId = await seedNotification(user.id);
      const res = await request(app).patch(`/api/notifications/${notifId}/read`);
      expect(res.status).toBe(200);
      expect(res.body.is_read).toBe(1);
    });
  });

  describe('POST /api/notifications/read-all', () => {
    it('marks all notifications as read', async () => {
      const user = await createUser();
      await seedNotification(user.id);
      await seedNotification(user.id);
      const res = await request(app)
        .post('/api/notifications/read-all')
        .send({ user_id: user.id });
      expect(res.status).toBe(200);

      const count = await request(app).get(`/api/notifications/count?user_id=${user.id}`);
      expect(count.body.count).toBe(0);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('deletes a notification', async () => {
      const user = await createUser();
      const notifId = await seedNotification(user.id);
      const res = await request(app).delete(`/api/notifications/${notifId}`);
      expect(res.status).toBe(204);
    });
  });
});
