import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import {
  createMemberAndLogin,
  createPatientAndLogin,
} from '../config/auth-helper';
import { getTestApp, getTestDataSource } from '../config/setup-e2e';

describe('Patient Requirements (e2e)', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  describe('POST /patient-requirements', () => {
    it('returns 201 and creates requirement', async () => {
      const { cookies } = await createMemberAndLogin();
      const { user: patient } = await createPatientAndLogin();

      const res = await request(app.getHttpServer())
        .post('/patient-requirements')
        .set('Cookie', cookies)
        .send({
          patientId: patient.id,
          type: 'medical_report',
          title: 'Relatorio medico',
          description: null,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBeDefined();
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .post('/patient-requirements')
        .expect(401);
    });
  });

  describe('GET /patient-requirements', () => {
    it('returns 200 with paginated list', async () => {
      const { cookies } = await createMemberAndLogin();

      const res = await request(app.getHttpServer())
        .get('/patient-requirements?page=1&perPage=10')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.data.requirements).toBeDefined();
      expect(res.body.data.total).toBeDefined();
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/patient-requirements?page=1&perPage=10')
        .expect(401);
    });
  });

  describe('PATCH /patient-requirements/:id/approve', () => {
    it('returns 200 and approves requirement', async () => {
      const { cookies } = await createMemberAndLogin();
      const { user: patient } = await createPatientAndLogin();

      await request(app.getHttpServer())
        .post('/patient-requirements')
        .set('Cookie', cookies)
        .send({
          patientId: patient.id,
          type: 'medical_report',
          title: 'Relatorio medico',
          description: null,
        })
        .expect(201);

      const dataSource = getTestDataSource();
      const rows = await dataSource.query(
        'SELECT id FROM patient_requirements ORDER BY created_at DESC LIMIT 1',
      );
      const id = rows[0].id;

      const res = await request(app.getHttpServer())
        .patch(`/patient-requirements/${id}/approve`)
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createMemberAndLogin();

      await request(app.getHttpServer())
        .patch(
          '/patient-requirements/00000000-0000-0000-0000-000000000000/approve',
        )
        .set('Cookie', cookies)
        .expect(404);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch(
          '/patient-requirements/00000000-0000-0000-0000-000000000000/approve',
        )
        .expect(401);
    });
  });

  describe('PATCH /patient-requirements/:id/decline', () => {
    it('returns 200 and declines requirement', async () => {
      const { cookies } = await createMemberAndLogin();
      const { user: patient } = await createPatientAndLogin();

      await request(app.getHttpServer())
        .post('/patient-requirements')
        .set('Cookie', cookies)
        .send({
          patientId: patient.id,
          type: 'medical_report',
          title: 'Relatorio medico',
          description: null,
        })
        .expect(201);

      const dataSource = getTestDataSource();
      const rows = await dataSource.query(
        'SELECT id FROM patient_requirements ORDER BY created_at DESC LIMIT 1',
      );
      const id = rows[0].id;

      const res = await request(app.getHttpServer())
        .patch(`/patient-requirements/${id}/decline`)
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createMemberAndLogin();

      await request(app.getHttpServer())
        .patch(
          '/patient-requirements/00000000-0000-0000-0000-000000000000/decline',
        )
        .set('Cookie', cookies)
        .expect(404);
    });

    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .patch(
          '/patient-requirements/00000000-0000-0000-0000-000000000000/decline',
        )
        .expect(401);
    });
  });
});
