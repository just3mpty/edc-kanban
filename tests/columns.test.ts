import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Column } from '../src/models/Column.js';
import { createTestUser, getAuthToken, createTestColumn } from './helpers.js';
import './setup.js';

const app = createApp();

describe('Columns Routes', () => {
  let authToken: string;

  beforeEach(async () => {
    const user = await createTestUser();
    authToken = getAuthToken(user);
  });

  describe('GET /api/columns', () => {
    it('should return an empty array when no column exists', async () => {
      const response = await request(app)
        .get('/api/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Columns retrieved successfully',
        data: [],
      });
    });

    it('should return all columns sorted by position', async () => {
      await createTestColumn('Terminé', 2);
      await createTestColumn('A faire', 0);
      await createTestColumn('En cours', 1);

      const response = await request(app)
        .get('/api/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.map((column: { name: string }) => column.name)).toEqual([
        'A faire',
        'En cours',
        'Terminé',
      ]);
      expect(response.body.data[0]).toMatchObject({
        _id: expect.any(String),
        name: 'A faire',
        position: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app).get('/api/columns').expect(401);

      expect(response.body).toEqual({ error: 'No token provided' });
    });
  });

  describe('POST /api/columns', () => {
    it('should create a column and insert it in the database', async () => {
      const response = await request(app)
        .post('/api/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'A faire' })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.message).toBe('Column created successfully');
      expect(response.body.data).toMatchObject({
        _id: expect.any(String),
        name: 'A faire',
        position: 0,
      });

      const saved = await Column.findById(response.body.data._id).lean();
      expect(saved).not.toBeNull();
      expect(saved?.name).toBe('A faire');
      expect(await Column.countDocuments()).toBe(1);
    });

    it('should place the new column after the existing ones', async () => {
      await createTestColumn('A faire', 0);

      const response = await request(app)
        .post('/api/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'En cours' })
        .expect(201);

      expect(response.body.data.position).toBe(1);
      expect(await Column.countDocuments()).toBe(2);
    });

    it('should return 400 and insert nothing if name is missing', async () => {
      const response = await request(app)
        .post('/api/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation error');
      expect(response.body.details[0]).toMatchObject({ path: 'name' });
      expect(await Column.countDocuments()).toBe(0);
    });

    it('should return 400 if a column with the same name exists', async () => {
      await createTestColumn('A faire', 0);

      const response = await request(app)
        .post('/api/columns')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'A faire' })
        .expect(400);

      expect(response.body.error).toBe('Duplicate entry');
      expect(await Column.countDocuments()).toBe(1);
    });

    it('should return 401 and insert nothing without authentication token', async () => {
      await request(app).post('/api/columns').send({ name: 'A faire' }).expect(401);

      expect(await Column.countDocuments()).toBe(0);
    });
  });
});
