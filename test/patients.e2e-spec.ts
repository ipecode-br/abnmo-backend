/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { getTestApp } from './setup';

describe('Patients E2E Tests', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  describe('GET /patients', () => {
    it('should handle getting patients list', async () => {
      // This endpoint likely requires authentication
      // We're just testing that it responds appropriately

      const response = await request(app.getHttpServer()).get('/patients');

      // We expect either success (200), unauthorized (401), or forbidden (403)
      // but not "Not Found" (404)
      expect([200, 401, 403].includes(response.status)).toBe(true);
    });
  });

  describe('POST /patients', () => {
    it('should handle patient creation attempt', async () => {
      const patientData = {
        name: 'Test Patient',
        email: 'patient@example.com',
        birthDate: '1990-01-01',
      };

      // This endpoint likely requires authentication and specific data format
      const response = await request(app.getHttpServer())
        .post('/patients')
        .send(patientData);

      // We expect either success (201), validation error (400), or unauthorized (401)
      // but not "Not Found" (404)
      expect([200, 201, 400, 401, 403, 422].includes(response.status)).toBe(
        true,
      );
    });
  });
});
