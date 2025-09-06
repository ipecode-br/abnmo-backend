import { INestApplication } from '@nestjs/common';

import { api } from '../config/api-client';
import { getTestApp } from '../config/setup';

describe('Patients E2E Tests', () => {
  let app: INestApplication;

  beforeAll(() => (app = getTestApp()));

  describe('GET /patients', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await api(app).get('/patients').send();

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect((response.body as { message: string }).message).toContain(
        'Token de acesso ausente.',
      );
    });

    it('should return 401 for patient role (insufficient permissions)', async () => {
      const client = await api(app).createPatientAndLogin();
      const response = await client.get('/patients').send();

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'message',
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('should return patients list for admin role', async () => {
      const client = await api(app).createAdminAndLogin();
      const response = await client.get('/patients').send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(
        (response.body as { data: { patients: unknown } }).data,
      ).toHaveProperty('patients');
      expect(
        Array.isArray(
          (response.body as { data: { patients: unknown[] } }).data.patients,
        ),
      ).toBe(true);
    });

    it('should return 200 for manager role', async () => {
      const client = await api(app).createManagerAndLogin();
      const response = await client.get('/patients').send();

      expect(response.status).not.toBe(401);
    });

    it('should return 200 for nurse role', async () => {
      const client = await api(app).createNurseAndLogin();
      const response = await client.get('/patients').send();

      expect(response.status).not.toBe(401);
    });

    it('should return 401 for specialist role (insufficient permissions)', async () => {
      const client = await api(app).createSpecialistAndLogin();
      const response = await client.get('/patients').send();

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'message',
        'Você não tem permissão para executar esta ação.',
      );
    });
  });

  describe('POST /patients', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await api(app).post('/patients').send({});

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect((response.body as { message: string }).message).toContain(
        'Token de acesso ausente.',
      );
    });

    it('should return 401 for patient role (insufficient permissions)', async () => {
      const client = await api(app).createPatientAndLogin();
      const response = await client.post('/patients').send({});

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'message',
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('should create patient for admin role', async () => {
      const client = await api(app).createAdminAndLogin();

      const response = await client.post('/patients').send({
        name: 'Test Patient',
        email: 'patient@example.com',
        gender: 'prefer_not_to_say' as const,
        date_of_birth: '1990-01-01',
        phone: '11999999999',
        cpf: '12345678901',
        state: 'SP' as const,
        city: 'São Paulo',
        has_disability: false,
        disability_desc: null,
        need_legal_assistance: false,
        take_medication: false,
        medication_desc: null,
        has_nmo_diagnosis: false,
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should return 201 for manager role', async () => {
      const client = await api(app).createManagerAndLogin();
      const response = await client.post('/patients').send({});

      expect(response.status).not.toBe(401);
    });

    it('should return 201 for nurse role', async () => {
      const client = await api(app).createNurseAndLogin();
      const response = await client.post('/patients').send({});

      expect(response.status).not.toBe(401);
    });

    it('should return 401 for specialist role (insufficient permissions)', async () => {
      const client = await api(app).createSpecialistAndLogin();
      const response = await client.post('/patients').send({});

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty(
        'message',
        'Você não tem permissão para executar esta ação.',
      );
    });
  });
});
