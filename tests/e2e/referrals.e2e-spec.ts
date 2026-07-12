import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import {
  createPatientAndLogin,
  createUserAndLogin,
} from '../config/auth-helper';
import { getTestApp, getTestDataSource } from '../config/setup-e2e';

describe('Referrals (e2e)', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  describe('POST /referrals', () => {
    it('returns 201 and creates referral', async () => {
      const { cookies } = await createUserAndLogin({
        role: 'member',
        features: ['create:referral'],
      });
      const { user: patient } = await createPatientAndLogin();

      const res = await request(app.getHttpServer())
        .post('/referrals')
        .set('Cookie', cookies)
        .send({
          patientId: patient.id,
          date: new Date().toISOString(),
          condition: 'nmo',
          professionalName: 'Dr. Test',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBeDefined();
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer()).post('/referrals').expect(401);
    });
  });

  describe('GET /referrals', () => {
    it('returns 200 with paginated list', async () => {
      const { cookies } = await createUserAndLogin({
        role: 'member',
        features: ['read:referral:others'],
      });

      const res = await request(app.getHttpServer())
        .get('/referrals?page=1&perPage=10')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.data.referrals).toBeDefined();
      expect(res.body.data.total).toBeDefined();
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/referrals?page=1&perPage=10')
        .expect(401);
    });
  });

  describe('PUT /referrals/:id', () => {
    it('returns 200 and updates referral', async () => {
      const { cookies } = await createUserAndLogin({
        role: 'member',
        features: ['create:referral', 'update:referral:others'],
      });
      const { user: patient } = await createPatientAndLogin();

      await request(app.getHttpServer())
        .post('/referrals')
        .set('Cookie', cookies)
        .send({
          patientId: patient.id,
          date: new Date().toISOString(),
          condition: 'nmo',
          professionalName: 'Dr. Test',
        })
        .expect(201);

      const dataSource = getTestDataSource();
      const rows = await dataSource.query(
        'SELECT id FROM referrals ORDER BY created_at DESC LIMIT 1',
      );
      const id = rows[0].id;

      const res = await request(app.getHttpServer())
        .put(`/referrals/${id}`)
        .set('Cookie', cookies)
        .send({
          date: new Date().toISOString(),
          condition: 'mog',
          annotation: null,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createUserAndLogin({
        role: 'member',
        features: ['update:referral:others'],
      });

      await request(app.getHttpServer())
        .put('/referrals/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies)
        .send({
          date: new Date().toISOString(),
          condition: 'nmo',
          annotation: null,
        })
        .expect(404);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .put('/referrals/00000000-0000-0000-0000-000000000000')
        .send({
          date: new Date().toISOString(),
          condition: 'nmo',
          annotation: null,
        })
        .expect(401);
    });
  });

  describe('PATCH /referrals/:id/cancel', () => {
    it('returns 200 and cancels referral', async () => {
      const { cookies } = await createUserAndLogin({
        role: 'member',
        features: ['create:referral', 'cancel:referral:others'],
      });
      const { user: patient } = await createPatientAndLogin();

      await request(app.getHttpServer())
        .post('/referrals')
        .set('Cookie', cookies)
        .send({
          patientId: patient.id,
          date: new Date().toISOString(),
          condition: 'nmo',
          professionalName: 'Dr. Test',
        })
        .expect(201);

      const dataSource = getTestDataSource();
      const rows = await dataSource.query(
        'SELECT id FROM referrals ORDER BY created_at DESC LIMIT 1',
      );
      const id = rows[0].id;

      const res = await request(app.getHttpServer())
        .patch(`/referrals/${id}/cancel`)
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createUserAndLogin({
        role: 'member',
        features: ['cancel:referral:others'],
      });

      await request(app.getHttpServer())
        .patch('/referrals/00000000-0000-0000-0000-000000000000/cancel')
        .set('Cookie', cookies)
        .expect(404);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch('/referrals/00000000-0000-0000-0000-000000000000/cancel')
        .expect(401);
    });
  });
});
