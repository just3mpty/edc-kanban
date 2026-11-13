import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { OF } from '../src/models/OF.js';
import { createTestUser, getAuthToken, createTestColumn, createTestOF } from './helpers.js';
import './setup.js';

const app = createApp();

describe('Security', () => {
  it('should send security headers and hide the framework', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('should return 401 with an invalid token', async () => {
    const response = await request(app)
      .get('/api/columns')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(response.body).toEqual({ error: 'Invalid or expired token' });
  });

  it('should remove Mongo operators that are not part of the validation schema', async () => {
    const user = await createTestUser();
    const token = getAuthToken(user);
    const column = await createTestColumn('A faire', 0);
    const of = await createTestOF(column._id.toString(), 'OF 1', 'Description à conserver');

    await request(app)
      .put(`/api/ofs/${of._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'OF modifié', $unset: { description: 1 } })
      .expect(200);

    const saved = await OF.findById(of._id).lean();
    expect(saved?.title).toBe('OF modifié');
    expect(saved?.description).toBe('Description à conserver');
  });

  it('should return 400 without technical details for an invalid identifier', async () => {
    const user = await createTestUser();
    const token = getAuthToken(user);

    const response = await request(app)
      .get('/api/columns/not-an-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    expect(response.body).toEqual({ error: 'Invalid identifier' });
  });

  it('should limit authentication attempts', async () => {
    const credentials = { email: 'nobody@example.com', password: 'wrongpassword' };

    for (let i = 0; i < 20; i++) {
      await request(app).post('/api/auth/login').send(credentials).expect(401);
    }

    const response = await request(app).post('/api/auth/login').send(credentials).expect(429);
    expect(response.body).toEqual({ error: 'Too many authentication attempts, please try again later' });
  });
});
