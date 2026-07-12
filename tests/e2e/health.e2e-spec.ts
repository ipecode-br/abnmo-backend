import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { getTestApp } from '../config/setup-e2e';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  it('GET /status returns 200 or 503 with api and database status', async () => {
    const res = await request(app.getHttpServer())
      .get('/status')
      .expect([200, 503]);

    expect(res.body.success).toBeDefined();
    expect(res.body.message).toBeDefined();
    expect(res.body.data).toBeDefined();
    expect(res.body.data.api).toBeDefined();
    expect(res.body.data.database).toBeDefined();
  });
});
