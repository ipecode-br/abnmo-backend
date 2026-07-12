import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { getTestApp } from '../config/setup-e2e';

describe('Status (e2e)', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  describe('GET /status', () => {
    it('returns 200 with service statuses', async () => {
      const res = await request(app.getHttpServer()).get('/status').expect(200);

      expect(res.body.data.api.status).toBe('ok');
      expect(res.body.data.database.status).toBe('ok');
    });
  });
});
