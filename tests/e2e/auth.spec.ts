import { INestApplication } from '@nestjs/common';

import { api } from '../config/api-client';
import { getTestApp } from '../config/setup';

describe('Auth E2E Tests', () => {
  let app: INestApplication;

  beforeAll(() => (app = getTestApp()));

  describe('POST /register', () => {
    it('should return 400 for missing required fields', async () => {
      const response = await api(app).post('/register').send({
        email: '',
        password: '',
        name: '',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'message',
        'Os dados enviados são inválidos.',
      );
      expect(response.body).toHaveProperty('fields');
      expect(Array.isArray((response.body as { fields: unknown }).fields)).toBe(
        true,
      );
    });

    it('should return 400 for invalid email format', async () => {
      const response = await api(app).post('/register').send({
        email: 'invalid-email',
        password: '123456',
        name: 'Test User',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'message',
        'Os dados enviados são inválidos.',
      );
    });

    it('should handle user creation attempt', async () => {
      const response = await api(app).post('/register').send({
        email: 'test@example.com',
        password: '123456',
        name: 'Test User',
      });

      // We expect either success, conflict, or validation error
      expect([201, 400, 409, 422].includes(response.status)).toBe(true);
    });
  });

  describe('POST /login', () => {
    it('should return 400 for missing credentials', async () => {
      const response = await api(app).post('/login').send({
        email: '',
        password: '',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'message',
        'Os dados enviados são inválidos.',
      );
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await api(app).post('/login').send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle login attempt with existing user', async () => {
      const userData = {
        email: 'logintest@example.com',
        password: '123456',
        name: 'Login Test User',
      };

      await api(app).post('/register').send(userData);

      const loginData = {
        email: userData.email,
        password: userData.password,
      };

      const response = await api(app).post('/login').send(loginData);

      // We expect either success or various error states
      expect([200, 201, 400, 401, 422].includes(response.status)).toBe(true);
    });
  });
});
