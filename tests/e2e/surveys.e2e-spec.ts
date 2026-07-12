import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createMemberAndLogin } from '../config/auth-helper';
import { getTestApp } from '../config/setup-e2e';

describe('Surveys (e2e)', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  describe('GET /surveys', () => {
    it('returns 200 with paginated list', async () => {
      const { cookies } = await createMemberAndLogin();

      const res = await request(app.getHttpServer())
        .get('/surveys?page=1&perPage=10')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.data.surveys).toBeDefined();
      expect(res.body.data.total).toBeDefined();
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/surveys?page=1&perPage=10')
        .expect(401);
    });
  });

  describe('GET /surveys/:id', () => {
    it('returns 404 for non-existent survey', async () => {
      const { cookies } = await createMemberAndLogin();

      await request(app.getHttpServer())
        .get('/surveys/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies)
        .expect(404);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/surveys/00000000-0000-0000-0000-000000000000')
        .expect(401);
    });
  });
});
