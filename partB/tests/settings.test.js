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
    .send({ email: 'settings@test.com', username: 'settingsuser', password: 'password123' });
  return res.body;
}

describe('Settings API', () => {
  describe('GET /api/settings/:userId', () => {
    it('returns default settings for new user', async () => {
      const user = await createUser();
      const res = await request(app).get(`/api/settings/${user.id}`);
      expect(res.status).toBe(200);
      expect(res.body.theme).toBe('system');
      expect(res.body.language).toBe('en');
      expect(res.body.notifications_enabled).toBe(1);
    });
  });

  describe('PATCH /api/settings/:userId', () => {
    it('updates theme setting', async () => {
      const user = await createUser();
      const res = await request(app)
        .patch(`/api/settings/${user.id}`)
        .send({ theme: 'dark' });
      expect(res.status).toBe(200);
      expect(res.body.theme).toBe('dark');
    });

    it('updates language setting', async () => {
      const user = await createUser();
      const res = await request(app)
        .patch(`/api/settings/${user.id}`)
        .send({ language: 'mn' });
      expect(res.status).toBe(200);
      expect(res.body.language).toBe('mn');
    });

    it('updates notifications_enabled to false', async () => {
      const user = await createUser();
      const res = await request(app)
        .patch(`/api/settings/${user.id}`)
        .send({ notificationsEnabled: false });
      expect(res.status).toBe(200);
      expect(res.body.notifications_enabled).toBe(0);
    });
  });
});
