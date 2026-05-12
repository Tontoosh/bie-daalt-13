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
    .send({ email: 'goal@test.com', username: 'goaluser', password: 'password123' });
  return res.body;
}

describe('Goals API', () => {
  describe('POST /api/goals', () => {
    it('creates a goal', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/goals')
        .send({ userId: user.id, title: 'Learn Node.js' });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Learn Node.js');
      expect(res.body.status).toBe('active');
      expect(res.body.progress).toBe(0);
    });

    it('returns 400 if title missing', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/goals')
        .send({ userId: user.id });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/goals', () => {
    it('returns empty array initially', async () => {
      const user = await createUser();
      const res = await request(app).get(`/api/goals?user_id=${user.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns goals for user', async () => {
      const user = await createUser();
      await request(app)
        .post('/api/goals')
        .send({ userId: user.id, title: 'Ship product' });
      const res = await request(app).get(`/api/goals?user_id=${user.id}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Ship product');
    });
  });

  describe('GET /api/goals/:id', () => {
    it('returns goal by id', async () => {
      const user = await createUser();
      const created = await request(app)
        .post('/api/goals')
        .send({ userId: user.id, title: 'Find me' });
      const res = await request(app).get(`/api/goals/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Find me');
    });

    it('returns 404 for missing goal', async () => {
      const res = await request(app).get('/api/goals/99999');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/goals/:id', () => {
    it('updates goal progress', async () => {
      const user = await createUser();
      const created = await request(app)
        .post('/api/goals')
        .send({ userId: user.id, title: 'Progress test' });
      const res = await request(app)
        .patch(`/api/goals/${created.body.id}`)
        .send({ progress: 50 });
      expect(res.status).toBe(200);
      expect(res.body.progress).toBe(50);
    });

    it('updates goal status to completed', async () => {
      const user = await createUser();
      const created = await request(app)
        .post('/api/goals')
        .send({ userId: user.id, title: 'Complete me' });
      const res = await request(app)
        .patch(`/api/goals/${created.body.id}`)
        .send({ status: 'completed' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
    });
  });

  describe('DELETE /api/goals/:id', () => {
    it('deletes goal', async () => {
      const user = await createUser();
      const created = await request(app)
        .post('/api/goals')
        .send({ userId: user.id, title: 'Delete me' });
      const res = await request(app).delete(`/api/goals/${created.body.id}`);
      expect(res.status).toBe(204);
    });

    it('returns 404 for non-existent goal', async () => {
      const res = await request(app).delete('/api/goals/99999');
      expect(res.status).toBe(404);
    });
  });

  describe('Goal Milestones', () => {
    it('adds and retrieves milestones', async () => {
      const user = await createUser();
      const goal = await request(app)
        .post('/api/goals')
        .send({ userId: user.id, title: 'With milestones' });
      await request(app)
        .post(`/api/goals/${goal.body.id}/milestones`)
        .send({ title: 'Step 1' });
      const res = await request(app).get(`/api/goals/${goal.body.id}/milestones`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Step 1');
    });

    it('deletes milestone', async () => {
      const user = await createUser();
      const goal = await request(app)
        .post('/api/goals')
        .send({ userId: user.id, title: 'Milestone delete' });
      const ms = await request(app)
        .post(`/api/goals/${goal.body.id}/milestones`)
        .send({ title: 'Remove me' });
      const res = await request(app)
        .delete(`/api/goals/${goal.body.id}/milestones/${ms.body.id}`);
      expect(res.status).toBe(204);
    });
  });
});
