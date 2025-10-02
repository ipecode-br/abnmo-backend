import { INestApplication } from '@nestjs/common';

import { api } from '../config/api-client';
import { getTestApp } from '../config/setup';

describe('App E2E Tests', () => {
  let app: INestApplication;

  beforeAll(() => (app = getTestApp()));

  describe('GET /', () => {
    it('should return application info', async () => {
      const response = await api(app).get('/').send();

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });
  });
});
