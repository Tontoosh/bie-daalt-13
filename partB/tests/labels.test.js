'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const request = require('supertest');
const app = require('../src/index');
const { setupTestDb, teardownTestDb, closeTestDb } = require('./helpers/mysqlTestHelper');

beforeAll(() => setupTestDb());
afterEach(() => teardownTestDb());
afterAll(() => closeTestDb());

describe('Labels API', () => {
  describe('POST /api/labels', () => {
    it('creates a label', async () => {
      const res = await request(app)
        .post('/api/labels')
        .send({ name: 'bug', color: '#ff0000' });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('bug');
    });

    it('returns 400 if name missing', async () => {
      const res = await request(app).post('/api/labels').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/labels', () => {
    it('returns all labels', async () => {
      await request(app).post('/api/labels').send({ name: 'feature' });
      const res = await request(app).get('/api/labels');
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/labels/:id', () => {
    it('deletes label and cascades task_labels', async () => {
      const label = await request(app)
        .post('/api/labels')
        .send({ name: 'temp' });
      const task = await request(app)
        .post('/api/tasks')
        .send({ title: 'labelled task' });
      await request(app)
        .post(`/api/tasks/${task.body.id}/labels`)
        .send({ label_id: label.body.id });

      const del = await request(app).delete(`/api/labels/${label.body.id}`);
      expect(del.status).toBe(204);

      const taskLabels = await request(app).get(`/api/tasks/${task.body.id}/labels`);
      expect(taskLabels.body).toEqual([]);
    });
  });
});
