'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });
const request = require('supertest');
const app = require('../src/index');
const { setupTestDb, teardownTestDb, closeTestDb } = require('./helpers/mysqlTestHelper');

beforeAll(() => setupTestDb());
afterEach(() => teardownTestDb());
afterAll(() => closeTestDb());

async function createUser(suffix = '') {
  const res = await request(app)
    .post('/api/users/register')
    .send({ email: `proj${suffix}@test.com`, username: `projuser${suffix}`, password: 'password123' });
  return res.body;
}

async function createProject(ownerId, overrides = {}) {
  const res = await request(app)
    .post('/api/projects')
    .send({ ownerId, name: 'My Project', color: '#6366f1', ...overrides });
  return res.body;
}

describe('Projects API', () => {
  describe('POST /api/projects', () => {
    it('creates a project', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/projects')
        .send({ ownerId: user.id, name: 'Test Project' });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Test Project');
    });

    it('returns 400 if name missing', async () => {
      const user = await createUser();
      const res = await request(app)
        .post('/api/projects')
        .send({ ownerId: user.id });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/projects', () => {
    it('returns empty array for user with no projects', async () => {
      const user = await createUser();
      const res = await request(app).get(`/api/projects?user_id=${user.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns projects for owner', async () => {
      const user = await createUser();
      await createProject(user.id);
      const res = await request(app).get(`/api/projects?user_id=${user.id}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe('My Project');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('returns project by id', async () => {
      const user = await createUser();
      const proj = await createProject(user.id);
      const res = await request(app).get(`/api/projects/${proj.id}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('My Project');
    });

    it('returns 404 for missing project', async () => {
      const res = await request(app).get('/api/projects/99999');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/projects/:id', () => {
    it('updates project name', async () => {
      const user = await createUser();
      const proj = await createProject(user.id);
      const res = await request(app)
        .patch(`/api/projects/${proj.id}`)
        .send({ name: 'Renamed' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Renamed');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('deletes project', async () => {
      const user = await createUser();
      const proj = await createProject(user.id);
      const res = await request(app).delete(`/api/projects/${proj.id}`);
      expect(res.status).toBe(204);
    });

    it('returns 404 for non-existent project', async () => {
      const res = await request(app).delete('/api/projects/99999');
      expect(res.status).toBe(404);
    });
  });

  describe('Project Members', () => {
    it('adds a member to project', async () => {
      const owner = await createUser('a');
      const member = await createUser('b');
      const proj = await createProject(owner.id);
      const res = await request(app)
        .post(`/api/projects/${proj.id}/members`)
        .send({ userId: member.id, role: 'editor' });
      expect(res.status).toBe(201);
    });

    it('lists project members', async () => {
      const owner = await createUser('c');
      const member = await createUser('d');
      const proj = await createProject(owner.id);
      await request(app)
        .post(`/api/projects/${proj.id}/members`)
        .send({ userId: member.id, role: 'viewer' });
      const res = await request(app).get(`/api/projects/${proj.id}/members`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('removes a member from project', async () => {
      const owner = await createUser('e');
      const member = await createUser('f');
      const proj = await createProject(owner.id);
      await request(app)
        .post(`/api/projects/${proj.id}/members`)
        .send({ userId: member.id, role: 'viewer' });
      const res = await request(app)
        .delete(`/api/projects/${proj.id}/members/${member.id}`);
      expect(res.status).toBe(204);
    });
  });

  describe('GET /api/projects/:id/tasks', () => {
    it('returns empty task list for new project', async () => {
      const user = await createUser('g');
      const proj = await createProject(user.id);
      const res = await request(app).get(`/api/projects/${proj.id}/tasks`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});
