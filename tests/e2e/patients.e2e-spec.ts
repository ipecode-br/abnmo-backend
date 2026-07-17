import { INestApplication } from '@nestjs/common';

import type {
  GetPatientOptionsResponse,
  GetPatientResponse,
  GetPatientsResponse,
  UpdatePatientBody,
} from '@/app/http/patients/patients.dtos';

import {
  ApiClient,
  BaseResponseBody,
  createApiClient,
} from '../config/api-client';
import { createAdmin, createMember, createPatient } from '../config/helpers';
import { getTestApp } from '../config/setup-e2e';
import { getPatientById } from '../helpers/patients';
import { createSurvey } from '../helpers/surveys';

describe('Patients (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;

  beforeAll(() => {
    app = getTestApp();
    api = createApiClient(app);
  });

  describe('GET /patients', () => {
    it('paginates patients', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['read:patient:others'],
      });

      const totalPatients = 15;
      for (let i = 0; i < totalPatients; i++) {
        await createPatient();
      }

      const firstPage = await api.get<GetPatientsResponse>(
        '/patients',
        { page: 1, perPage: 10 },
        { cookies },
      );

      expect(firstPage.status).toBe(200);
      expect(firstPage.body.data.patients).toHaveLength(10);
      expect(firstPage.body.data.total).toBe(totalPatients);

      const secondPage = await api.get<GetPatientsResponse>(
        '/patients',
        { page: 2, perPage: 10 },
        { cookies },
      );

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.data.patients).toHaveLength(5);
      expect(secondPage.body.data.total).toBe(totalPatients);
    });

    it('filters by status', async () => {
      const { cookies } = await createAdmin({ login: true });

      await createPatient({ status: 'active' });
      await createPatient({ status: 'active' });
      await createPatient({ status: 'inactive' });

      const res = await api.get<GetPatientsResponse>(
        '/patients',
        { page: 1, perPage: 10, status: 'inactive' },
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.data.patients).toHaveLength(1);
      expect(res.body.data.patients[0].status).toBe('inactive');
      expect(res.body.data.total).toBe(1);
    });

    it('filters by search', async () => {
      const { cookies } = await createAdmin({ login: true });

      await createPatient({ name: 'Alice Unique' });
      await createPatient({ name: 'Bob Normal' });

      const res = await api.get<GetPatientsResponse>(
        '/patients',
        { page: 1, perPage: 10, search: 'uniqu' },
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.data.patients).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.patients[0].name).toBe('Alice Unique');
    });

    it('filters by date range', async () => {
      const { cookies } = await createAdmin({ login: true });

      await createPatient({ name: 'Range Patient' });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const res = await api.get<GetPatientsResponse>(
        '/patients',
        {
          page: 1,
          perPage: 10,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.patients[0].name).toBe('Range Patient');
    });

    it('blocks user without "read:patient:others" feature', async () => {
      const { cookies } = await createMember({ login: true, features: [] });

      const res = await api.get(
        '/patients',
        { page: 1, perPage: 10 },
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });
  });

  describe('GET /patients/options', () => {
    it('lists active patients', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['read:patient:others'],
      });

      await createPatient({ status: 'active' });
      await createPatient({ status: 'inactive' });

      const res = await api.get<GetPatientOptionsResponse>(
        '/patients/options',
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.patients).toBeInstanceOf(Array);
      expect(res.body.data.patients.length).toBe(1);
    });

    it('blocks user without "read:patient:others" feature', async () => {
      const { cookies } = await createMember({ login: true, features: [] });

      const res = await api.get('/patients/options', undefined, { cookies });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });
  });

  describe('GET /patients/:id', () => {
    it('returns patient detail', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['read:patient:others'],
      });

      const { patient } = await createPatient();
      await createSurvey({ patient });

      const res = await api.get<GetPatientResponse>(
        `/patients/${patient.id}`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(patient.id);
      expect(res.body.data.name).toBe(patient.name);
      expect(res.body.data.email).toBe(patient.email);
    });

    it('allows patient to see own data', async () => {
      const { patient, cookies } = await createPatient({
        login: true,
        features: ['read:patient'],
      });
      await createSurvey({ patient });

      const res = await api.get<GetPatientResponse>(
        `/patients/${patient.id}`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(patient.id);
    });

    it('blocks patient to see other patient data', async () => {
      const { cookies } = await createPatient({
        login: true,
        features: ['read:patient'],
      });
      const { patient } = await createPatient();

      const res = await api.get(`/patients/${patient.id}`, undefined, {
        cookies,
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('returns not found for non-existent ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.get(
        '/patients/00000000-0000-0000-0000-000000000000',
        undefined,
        {
          cookies,
        },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Paciente não encontrado.');
    });

    it('blocks user without "read:patient" or "read:patient:others" feature', async () => {
      const { cookies } = await createMember({ login: true, features: [] });
      const { patient } = await createPatient();

      const res = await api.get(`/patients/${patient.id}`, undefined, {
        cookies,
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });
  });

  describe('PUT /patients/:id', () => {
    const updateBody: UpdatePatientBody = {
      name: 'Updated Patient',
      susId: '112233',
      cpf: '11122233344',
      phone: '11222223333',
      supportContacts: [
        {
          name: 'Contact Name',
          kinship: 'parent',
          phone: '11222223333',
        },
      ],
    };

    it('updates patient', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['update:patient:others'],
      });

      const { patient } = await createPatient();

      const res = await api.put<BaseResponseBody, UpdatePatientBody>(
        `/patients/${patient.id}`,
        updateBody,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Paciente atualizado com sucesso.');

      const updatedPatient = await getPatientById(patient.id);

      expect(updatedPatient?.name).toBe(updateBody.name);
      expect(updatedPatient?.phone).toBe(updateBody.phone);
      expect(updatedPatient?.cpf).toBe(updateBody.cpf);
      expect(updatedPatient?.susId).toBe(updateBody.susId);
    });

    it('rejects duplicate "CPF"', async () => {
      const { cookies } = await createAdmin({ login: true });

      const duplicatedCPF = '11111111111';
      await createPatient({ cpf: duplicatedCPF });
      const { patient: patient } = await createPatient({ cpf: '22222222222' });

      const res = await api.put<BaseResponseBody, UpdatePatientBody>(
        `/patients/${patient.id}`,
        { ...updateBody, cpf: duplicatedCPF },
        { cookies },
      );

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('O CPF informado já está registrado.');
    });

    it('returns not found for non-existent ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.put<BaseResponseBody, UpdatePatientBody>(
        '/patients/00000000-0000-0000-0000-000000000000',
        updateBody,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Paciente não encontrado.');
    });

    it('blocks user without "patients:update" feature', async () => {
      const { cookies } = await createMember({ login: true, features: [] });
      const { patient } = await createPatient();

      const res = await api.put<BaseResponseBody, UpdatePatientBody>(
        `/patients/${patient.id}`,
        updateBody,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });
  });

  describe('PATCH /patients/:id/deactivate', () => {
    it('deactivates patient', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['deactivate:patient'],
      });
      const { patient } = await createPatient({ status: 'active' });

      const res = await api.patch(
        `/patients/${patient.id}/deactivate`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Paciente inativado com sucesso.');

      const updated = await getPatientById(patient.id);

      expect(updated?.status).toBe('inactive');
    });

    it('rejects already inactive patient', async () => {
      const { cookies } = await createAdmin({ login: true });
      const { patient } = await createPatient({ status: 'inactive' });

      const res = await api.patch(
        `/patients/${patient.id}/deactivate`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Este paciente já está inativo.');
    });

    it('returns not found for non-existent ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.patch(
        '/patients/00000000-0000-0000-0000-000000000000/deactivate',
        undefined,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Paciente não encontrado.');
    });

    it('blocks user without "deactivate:patient" feature', async () => {
      const { cookies } = await createMember({ login: true, features: [] });
      const { patient } = await createPatient();

      const res = await api.patch(
        `/patients/${patient.id}/deactivate`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });
  });
});
