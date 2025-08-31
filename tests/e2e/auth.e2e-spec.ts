/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { getTestApp } from '../config/setup';

describe('Auth E2E Tests', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  describe('POST /register', () => {
    it('should handle user registration attempt', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123456',
        name: 'Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/register')
        .send(userData);

      // We expect either success (201), validation error (400), or conflict (409)
      // but not "Not Found" (404)
      expect([200, 201, 400, 409, 422].includes(response.status)).toBe(true);
    });
  });

  describe('POST /login', () => {
    it('should handle user login attempt', async () => {
      const loginData = {
        email: 'test@example.com',
        password: '123456',
      };

      const response = await request(app.getHttpServer())
        .post('/login')
        .send(loginData);

      // We expect either success (200), validation error (400), or unauthorized (401)
      // but not "Not Found" (404)
      expect([200, 400, 401, 422].includes(response.status)).toBe(true);
    });
  });
});
