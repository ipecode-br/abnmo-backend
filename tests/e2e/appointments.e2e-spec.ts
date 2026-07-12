import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import {
  createPatientAndLogin,
  createUserAndLogin,
} from '../config/auth-helper';
import { getTestApp, getTestDataSource } from '../config/setup-e2e';

describe('Appointments (e2e)', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  describe('POST /appointments', () => {
    it('returns 201 and creates appointment', async () => {
      const { cookies } = await createUserAndLogin({
        role: 'member',
        features: ['create:appointment'],
      });
      const { user: patient } = await createPatientAndLogin();

      const res = await request(app.getHttpServer())
        .post('/appointments')
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
      await request(app.getHttpServer()).post('/appointments').expect(401);
    });
  });

  describe('GET /appointments', () => {
    it('returns 200 with paginated list', async () => {
      const { cookies } = await createUserAndLogin({
        role: 'member',
        features: ['read:appointment:others'],
      });

      const res = await request(app.getHttpServer())
        .get('/appointments?page=1&perPage=10')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.data.appointments).toBeDefined();
      expect(res.body.data.total).toBeDefined();
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/appointments?page=1&perPage=10')
        .expect(401);
    });
  });

  describe('PUT /appointments/:id', () => {
    it('returns 200 and updates appointment', async () => {
      const { cookies } = await createUserAndLogin({
        role: 'member',
        features: ['create:appointment', 'update:appointment:others'],
      });
      const { user: patient } = await createPatientAndLogin();

      await request(app.getHttpServer())
        .post('/appointments')
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
        'SELECT id FROM appointments ORDER BY created_at DESC LIMIT 1',
      );
      const id = rows[0].id;

      const res = await request(app.getHttpServer())
        .put(`/appointments/${id}`)
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
        features: ['update:appointment:others'],
      });

      await request(app.getHttpServer())
        .put('/appointments/00000000-0000-0000-0000-000000000000')
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
        .put('/appointments/00000000-0000-0000-0000-000000000000')
        .send({
          date: new Date().toISOString(),
          condition: 'nmo',
          annotation: null,
        })
        .expect(401);
    });
  });

  describe('PATCH /appointments/:id/cancel', () => {
    it('returns 200 and cancels appointment', async () => {
      const { cookies } = await createUserAndLogin({
        role: 'member',
        features: ['create:appointment', 'cancel:appointment:others'],
      });
      const { user: patient } = await createPatientAndLogin();

      await request(app.getHttpServer())
        .post('/appointments')
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
        'SELECT id FROM appointments ORDER BY created_at DESC LIMIT 1',
      );
      const id = rows[0].id;

      const res = await request(app.getHttpServer())
        .patch(`/appointments/${id}/cancel`)
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createUserAndLogin({
        role: 'member',
        features: ['cancel:appointment:others'],
      });

      await request(app.getHttpServer())
        .patch('/appointments/00000000-0000-0000-0000-000000000000/cancel')
        .set('Cookie', cookies)
        .expect(404);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch('/appointments/00000000-0000-0000-0000-000000000000/cancel')
        .expect(401);
    });
  });
});
