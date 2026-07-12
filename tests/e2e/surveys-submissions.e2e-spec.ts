import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import {
  createMemberAndLogin,
  createUserAndLogin,
} from '../config/auth-helper';
import { getTestApp } from '../config/setup-e2e';

describe('Survey Submissions (e2e)', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  describe('POST /survey-submissions', () => {
    it('returns 201 and creates submission', async () => {
      const res = await request(app.getHttpServer())
        .post('/survey-submissions')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          phone: '11999999999',
          mimeType: 'application/pdf',
          fileSize: 1024,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.submissionId).toBeDefined();
    });
  });

  describe('GET /survey-submissions', () => {
    it('returns 200 with paginated list', async () => {
      const { cookies } = await createMemberAndLogin();

      const res = await request(app.getHttpServer())
        .get('/survey-submissions?page=1&perPage=10')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.data.submissions).toBeDefined();
      expect(res.body.data.total).toBeDefined();
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/survey-submissions?page=1&perPage=10')
        .expect(401);
    });
  });

  describe('GET /survey-submissions/:id', () => {
    it('returns 200 with submission details', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/survey-submissions')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          phone: '11999999999',
          mimeType: 'application/pdf',
          fileSize: 1024,
        })
        .expect(201);

      const submissionId = createRes.body.data.submissionId;

      const { cookies } = await createMemberAndLogin();

      const res = await request(app.getHttpServer())
        .get(`/survey-submissions/${submissionId}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.data.status).toBeDefined();
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createMemberAndLogin();

      await request(app.getHttpServer())
        .get('/survey-submissions/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies)
        .expect(404);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/survey-submissions/00000000-0000-0000-0000-000000000000')
        .expect(401);
    });
  });

  describe('PATCH /survey-submissions/:id/approve', () => {
    it('returns 200 and approves submission', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/survey-submissions')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          phone: '11999999999',
          mimeType: 'application/pdf',
          fileSize: 1024,
        })
        .expect(201);

      const submissionId = createRes.body.data.submissionId;

      const { cookies } = await createUserAndLogin({
        role: 'member',
        features: ['approve:survey'],
      });

      const res = await request(app.getHttpServer())
        .patch(`/survey-submissions/${submissionId}/approve`)
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch(
          '/survey-submissions/00000000-0000-0000-0000-000000000000/approve',
        )
        .expect(401);
    });
  });

  describe('PATCH /survey-submissions/:id/decline', () => {
    it('returns 200 and declines submission', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/survey-submissions')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          phone: '11999999999',
          mimeType: 'application/pdf',
          fileSize: 1024,
        })
        .expect(201);

      const submissionId = createRes.body.data.submissionId;

      const { cookies } = await createUserAndLogin({
        role: 'member',
        features: ['approve:survey'],
      });

      const res = await request(app.getHttpServer())
        .patch(`/survey-submissions/${submissionId}/decline`)
        .set('Cookie', cookies)
        .send({ reason: 'Documento invalido' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch(
          '/survey-submissions/00000000-0000-0000-0000-000000000000/decline',
        )
        .send({ reason: 'Documento invalido' })
        .expect(401);
    });
  });
});
