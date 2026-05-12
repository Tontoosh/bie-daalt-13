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
    .send({ email: 'note@test.com', username: 'noteuser', password: 'password123' });
  return res.body;
}

describe('Notes API', () => {
  describe('POST /api/notes', () => {
    it('creates a note', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/notes')
        .send({ userId: user.id, title: 'My Note', body: 'Note content' });
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('My Note');
      expect(res.body.body).toBe('Note content');
    });

    it('returns 400 if title missing', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/notes')
        .send({ userId: user.id, body: 'No title' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/notes', () => {
    it('returns empty array initially', async () => {
      const user = await createUser();
      const res = await request(app).get(`/api/notes?user_id=${user.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns notes for user', async () => {
      const user = await createUser();
      await request(app)
        .post('/api/notes')
        .send({ userId: user.id, title: 'Test Note' });
      const res = await request(app).get(`/api/notes?user_id=${user.id}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Test Note');
    });
  });

  describe('GET /api/notes/:id', () => {
    it('returns note by id', async () => {
      const user = await createUser();
      const created = await request(app)
        .post('/api/notes')
        .send({ userId: user.id, title: 'Find me' });
      const res = await request(app).get(`/api/notes/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Find me');
    });

    it('returns 404 for missing note', async () => {
      const res = await request(app).get('/api/notes/99999');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/notes/:id', () => {
    it('updates note title', async () => {
      const user = await createUser();
      const created = await request(app)
        .post('/api/notes')
        .send({ userId: user.id, title: 'Old title' });
      const res = await request(app)
        .patch(`/api/notes/${created.body.id}`)
        .send({ title: 'New title' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('New title');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('deletes note', async () => {
      const user = await createUser();
      const created = await request(app)
        .post('/api/notes')
        .send({ userId: user.id, title: 'Delete me' });
      const res = await request(app).delete(`/api/notes/${created.body.id}`);
      expect(res.status).toBe(204);
    });

    it('returns 404 for non-existent note', async () => {
      const res = await request(app).delete('/api/notes/99999');
      expect(res.status).toBe(404);
    });
  });
});
