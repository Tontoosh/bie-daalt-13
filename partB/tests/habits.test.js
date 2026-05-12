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
    .send({ email: 'habit@test.com', username: 'habituser', password: 'password123' });
  return res.body;
}

async function createHabit(overrides = {}) {
  const user = await createUser();
  const res = await request(app)
    .post('/api/habits')
    .send({ userId: user.id, name: 'Exercise', frequency: 'daily', color: '#34d399', ...overrides });
  return { habit: res.body, user };
}

describe('Habits API', () => {
  describe('POST /api/habits', () => {
    it('creates a habit with defaults', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/habits')
        .send({ userId: user.id, name: 'Read', frequency: 'daily' });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Read');
      expect(res.body.frequency).toBe('daily');
      expect(res.body.target_count).toBe(1);
    });

    it('creates weekly habit', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/habits')
        .send({ userId: user.id, name: 'Gym', frequency: 'weekly' });
      expect(res.status).toBe(201);
      expect(res.body.frequency).toBe('weekly');
    });

    it('returns 400 if name missing', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/habits')
        .send({ userId: user.id, frequency: 'daily' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/habits', () => {
    it('returns empty array initially', async () => {
      const user = await createUser();
      const res = await request(app).get(`/api/habits?user_id=${user.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns habits for user', async () => {
      const { habit, user } = await createHabit();
      const res = await request(app).get(`/api/habits?user_id=${user.id}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(habit.id);
    });
  });

  describe('GET /api/habits/:id', () => {
    it('returns habit by id', async () => {
      const { habit } = await createHabit();
      const res = await request(app).get(`/api/habits/${habit.id}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Exercise');
    });

    it('returns 404 for missing habit', async () => {
      const res = await request(app).get('/api/habits/99999');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/habits/:id', () => {
    it('updates habit name', async () => {
      const { habit } = await createHabit();
      const res = await request(app)
        .patch(`/api/habits/${habit.id}`)
        .send({ name: 'Meditation' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Meditation');
    });

    it('updates habit frequency', async () => {
      const { habit } = await createHabit();
      const res = await request(app)
        .patch(`/api/habits/${habit.id}`)
        .send({ frequency: 'weekly' });
      expect(res.status).toBe(200);
      expect(res.body.frequency).toBe('weekly');
    });
  });

  describe('DELETE /api/habits/:id', () => {
    it('deletes habit', async () => {
      const { habit } = await createHabit();
      const res = await request(app).delete(`/api/habits/${habit.id}`);
      expect(res.status).toBe(204);
    });

    it('returns 404 for non-existent habit', async () => {
      const res = await request(app).delete('/api/habits/99999');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/habits/:id/log', () => {
    it('logs a habit', async () => {
      const { habit, user } = await createHabit();
      const res = await request(app)
        .post(`/api/habits/${habit.id}/log`)
        .send({ userId: user.id });
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
    });

    it('increments count on duplicate log same day', async () => {
      const { habit, user } = await createHabit();
      const today = new Date().toISOString().slice(0, 10);
      await request(app)
        .post(`/api/habits/${habit.id}/log`)
        .send({ userId: user.id, loggedOn: today });
      const res = await request(app)
        .post(`/api/habits/${habit.id}/log`)
        .send({ userId: user.id, loggedOn: today });
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
    });
  });

  describe('GET /api/habits/:id/logs', () => {
    it('returns logs for habit', async () => {
      const { habit, user } = await createHabit();
      await request(app)
        .post(`/api/habits/${habit.id}/log`)
        .send({ userId: user.id });
      const res = await request(app).get(`/api/habits/${habit.id}/logs`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('returns empty logs for new habit', async () => {
      const { habit } = await createHabit();
      const res = await request(app).get(`/api/habits/${habit.id}/logs`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('GET /api/habits/:id/streak', () => {
    it('returns streak object with streak, todayCount, frequency', async () => {
      const { habit } = await createHabit();
      const res = await request(app).get(`/api/habits/${habit.id}/streak`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('streak');
      expect(res.body).toHaveProperty('todayCount');
      expect(res.body).toHaveProperty('frequency');
    });

    it('returns streak 0 for new habit', async () => {
      const { habit } = await createHabit();
      const res = await request(app).get(`/api/habits/${habit.id}/streak`);
      expect(res.status).toBe(200);
      expect(res.body.streak).toBe(0);
      expect(res.body.todayCount).toBe(0);
    });

    it('returns streak 1 after logging today', async () => {
      const { habit, user } = await createHabit();
      await request(app)
        .post(`/api/habits/${habit.id}/log`)
        .send({ userId: user.id });
      const res = await request(app).get(`/api/habits/${habit.id}/streak`);
      expect(res.status).toBe(200);
      expect(res.body.streak).toBe(1);
      expect(res.body.todayCount).toBe(1);
    });

    it('returns correct frequency in streak', async () => {
      const user = await createUser();
      const habRes = await request(app)
        .post('/api/habits')
        .send({ userId: user.id, name: 'Weekly habit', frequency: 'weekly' });
      const res = await request(app).get(`/api/habits/${habRes.body.id}/streak`);
      expect(res.status).toBe(200);
      expect(res.body.frequency).toBe('weekly');
    });
  });
});
