import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { Survey } from '@/domain/entities/survey';
import { User } from '@/domain/entities/user';

import {
  createAdminAndLogin,
  createMemberAndLogin,
  createPatientAndLogin,
} from '../config/auth-helper';
import { surveyFactory } from '../config/factories/survey.factory';
import { userFactory } from '../config/factories/user.factory';
import { getTestApp, getTestDataSource } from '../config/setup-e2e';

describe('Patients (e2e)', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  async function createPatientWithSurvey(overrides: Partial<User> = {}) {
    const ds = getTestDataSource();
    const usersRepo = ds.getRepository(User);
    const surveysRepo = ds.getRepository(Survey);

    const patient = usersRepo.create(
      userFactory({
        role: 'patient',
        ...overrides,
      }),
    );
    await usersRepo.save(patient);

    const survey = surveysRepo.create();
    Object.assign(survey, surveyFactory(patient));
    await surveysRepo.save(survey);

    return patient;
  }

  describe('GET /patients', () => {
    it('returns 401 without auth', async () => {
      await request(app.getHttpServer())
        .get('/patients')
        .query({ page: 1, perPage: 10 })
        .expect(401);
    });

    it('returns 403 as patient (insufficient permissions)', async () => {
      const { cookies } = await createPatientAndLogin();

      await request(app.getHttpServer())
        .get('/patients')
        .set('Cookie', cookies)
        .query({ page: 1, perPage: 10 })
        .expect(403);
    });

    it('returns 200 + paginated data as member with read:patient:others', async () => {
      await createPatientWithSurvey({
        name: 'Patient One',
        email: 'p1@example.com',
      });
      await createPatientWithSurvey({
        name: 'Patient Two',
        email: 'p2@example.com',
      });

      const { cookies } = await createMemberAndLogin();

      const res = await request(app.getHttpServer())
        .get('/patients')
        .set('Cookie', cookies)
        .query({ page: 1, perPage: 10 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.patients).toBeInstanceOf(Array);
      expect(res.body.data.total).toBeGreaterThanOrEqual(2);
    });

    it('GET /patients?search=xxx filters results', async () => {
      await createPatientWithSurvey({
        name: 'Alpha Patient',
        email: 'alpha@example.com',
      });
      await createPatientWithSurvey({
        name: 'Beta Patient',
        email: 'beta@example.com',
      });

      const { cookies } = await createMemberAndLogin();

      const res = await request(app.getHttpServer())
        .get('/patients')
        .set('Cookie', cookies)
        .query({ page: 1, perPage: 10, search: 'Alpha' })
        .expect(200);

      expect(res.body.data.patients).toHaveLength(1);
      expect(res.body.data.patients[0].name).toBe('Alpha Patient');
      expect(res.body.data.total).toBe(1);
    });
  });

  describe('GET /patients/:id', () => {
    it('returns 200 for existing patient', async () => {
      const patient = await createPatientWithSurvey({
        name: 'Detail Patient',
        email: 'detail@example.com',
      });
      const { cookies } = await createMemberAndLogin();

      const res = await request(app.getHttpServer())
        .get(`/patients/${patient.id}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(patient.id);
      expect(res.body.data.name).toBe(patient.name);
    });

    it('returns 404 for non-existent patient', async () => {
      const { cookies } = await createMemberAndLogin();

      await request(app.getHttpServer())
        .get('/patients/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookies)
        .expect(404);
    });
  });

  describe('PUT /patients/:id', () => {
    it('returns 200 on successful update (admin)', async () => {
      const patient = await createPatientWithSurvey({
        name: 'Old Name',
        email: 'update@example.com',
      });
      const { cookies } = await createAdminAndLogin();

      await request(app.getHttpServer())
        .put(`/patients/${patient.id}`)
        .set('Cookie', cookies)
        .send({
          name: 'Updated Name',
          cpf: '12345678901',
          phone: '11999999999',
          susId: '123456789012345',
          supportContacts: [
            { name: 'Contact Name', kinship: 'parent', phone: '11988888888' },
          ],
        })
        .expect(200);
    });
  });

  describe('PATCH /patients/:id/deactivate', () => {
    it('returns 200 on successful deactivate (admin)', async () => {
      const patient = await createPatientWithSurvey({
        name: 'To Deactivate',
        email: 'deact@example.com',
      });
      const { cookies } = await createAdminAndLogin();

      await request(app.getHttpServer())
        .patch(`/patients/${patient.id}/deactivate`)
        .set('Cookie', cookies)
        .expect(200);
    });

    it('returns 409 for already inactive patient', async () => {
      const patient = await createPatientWithSurvey({
        name: 'Already Inactive',
        email: 'inact@example.com',
        status: 'inactive',
      });
      const { cookies } = await createAdminAndLogin();

      await request(app.getHttpServer())
        .patch(`/patients/${patient.id}/deactivate`)
        .set('Cookie', cookies)
        .expect(409);
    });
  });

  describe('GET /patients/options', () => {
    it('returns 200 with active patients', async () => {
      await createPatientWithSurvey({
        name: 'Opt Patient',
        email: 'opt@example.com',
      });
      const { cookies } = await createMemberAndLogin();

      const res = await request(app.getHttpServer())
        .get('/patients/options')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.patients).toBeInstanceOf(Array);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
      expect(res.body.data.patients[0]).toHaveProperty('id');
      expect(res.body.data.patients[0]).toHaveProperty('name');
      expect(res.body.data.patients[0]).toHaveProperty('cpf');
    });
  });
});
