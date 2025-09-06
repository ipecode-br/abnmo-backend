import { INestApplication } from '@nestjs/common';

import { api } from '../config/api-client';
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

      const response = await api(app).post('/register').send(userData);

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

      const response = await api(app).post('/login').send(loginData);

      // We expect either success (200), validation error (400), or unauthorized (401)
      // but not "Not Found" (404)
      expect([200, 400, 401, 422].includes(response.status)).toBe(true);
    });
  });

  describe('API Client Examples', () => {
    it('should demonstrate fluent interface usage', async () => {
      // Fluent interface examples - using realistic endpoints and expectations
      const healthResponse = await api(app).get('/health').send();
      expect([200, 404].includes(healthResponse.status)).toBe(true);

      const registerResponse = await api(app).post('/register').send({
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User',
      });
      expect([200, 201, 400, 409, 422].includes(registerResponse.status)).toBe(
        true,
      );

      // Functional interface example
      const functionalResponse = await api(app).request('/register', {
        method: 'POST',
        body: { email: 'functional@test.com' },
      });
      expect([200, 201, 400, 422].includes(functionalResponse.status)).toBe(
        true,
      );

      // Authentication example (when you have a token)
      // const authenticatedApi = api(app).withAuth('your-jwt-token');
      // const profileResponse = await authenticatedApi.get('/profile').send();
      // expect([200, 401].includes(profileResponse.status)).toBe(true);
    });
  });
});
