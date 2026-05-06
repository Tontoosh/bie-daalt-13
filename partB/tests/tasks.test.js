'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const request = require('supertest');
const app = require('../src/index');
const { setupTestDb, teardownTestDb, closeTestDb } = require('./helpers/mysqlTestHelper');

beforeAll(() => setupTestDb());
afterEach(() => teardownTestDb());
afterAll(() => closeTestDb());

describe('Tasks API', () => {
  describe('GET /api/tasks', () => {
    it('returns empty array initially', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('POST /api/tasks', () => {
    it('creates a task with defaults', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test task' });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test task');
      expect(res.body.status).toBe('todo');
      expect(res.body.priority).toBe('medium');
    });

    it('returns 400 if title missing', async () => {
      const res = await request(app).post('/api/tasks').send({});
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid status', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'T', status: 'invalid' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('returns 404 for missing task', async () => {
      const res = await request(app).get('/api/tasks/99999');
      expect(res.status).toBe(404);
    });

    it('returns task by id', async () => {
      const created = await request(app)
        .post('/api/tasks')
        .send({ title: 'Find me' });
      const res = await request(app).get(`/api/tasks/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Find me');
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('updates task status', async () => {
      const created = await request(app)
        .post('/api/tasks')
        .send({ title: 'Update me' });
      const res = await request(app)
        .patch(`/api/tasks/${created.body.id}`)
        .send({ status: 'done' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('deletes task', async () => {
      const created = await request(app)
        .post('/api/tasks')
        .send({ title: 'Delete me' });
      const res = await request(app).delete(`/api/tasks/${created.body.id}`);
      expect(res.status).toBe(204);
    });

    it('returns 404 for non-existent task', async () => {
      const res = await request(app).delete('/api/tasks/99999');
      expect(res.status).toBe(404);
    });
  });
});
