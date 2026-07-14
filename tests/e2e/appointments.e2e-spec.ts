import { INestApplication } from '@nestjs/common';

import type {
  CreateAppointmentBody,
  GetAppointmentsResponse,
  UpdateAppointmentBody,
} from '@/app/http/appointments/appointments.dtos';

import {
  ApiClient,
  BaseResponseBody,
  createApiClient,
} from '../config/api-client';
import {
  createMember,
  createPatient,
  createSpecialist,
} from '../config/helpers';
import { getTestApp, getTestDataSource } from '../config/setup-e2e';
import { createAppointment, getAppointment } from '../helpers/appointments';

describe('Appointments (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;

  beforeAll(() => {
    app = getTestApp();
    api = createApiClient(app);
  });

  describe('POST /appointments', () => {
    const appointmentData: CreateAppointmentBody = {
      annotation: null,
      category: 'nursing',
      condition: 'stable',
      date: new Date(),
      patientId: '00000000-0000-0000-0000-000000000000',
      professionalName: null,
    };

    it('creates an appointment', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['create:appointment'],
      });
      const { patient } = await createPatient();

      const res = await api.post<BaseResponseBody, CreateAppointmentBody>(
        '/appointments',
        { ...appointmentData, patientId: patient.id },
        { cookies },
      );

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Atendimento cadastrado com sucesso.');
    });

    it('cannot create an appointment without auth', async () => {
      const res = await api.post('/appointments');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('cannot create an appointment without "create:appointment"', async () => {
      const { cookies } = await createMember({ login: true });

      const res = await api.post<BaseResponseBody, CreateAppointmentBody>(
        '/appointments',
        appointmentData,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('cannot create an appointment for a non-existent patient', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['create:appointment'],
      });

      const res = await api.post<BaseResponseBody, CreateAppointmentBody>(
        '/appointments',
        appointmentData,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Paciente não encontrado.');
    });
  });

  describe('GET /appointments', () => {
    it('paginates appointments properly', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['read:appointment:others'],
      });
      const { patient } = await createPatient();
      const dataSource = getTestDataSource();

      const totalAppointments = 15;
      for (let i = 0; i < totalAppointments; i++) {
        await createAppointment(dataSource, { patient });
      }

      const firstPage = await api.get<GetAppointmentsResponse>(
        '/appointments',
        { page: 1, perPage: 10 },
        { cookies },
      );

      expect(firstPage.status).toBe(200);
      expect(firstPage.body.data.appointments).toHaveLength(10);
      expect(firstPage.body.data.total).toBe(totalAppointments);

      const secondPage = await api.get<GetAppointmentsResponse>(
        '/appointments',
        { page: 2, perPage: 10 },
        { cookies },
      );

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.data.appointments).toHaveLength(5);
      expect(secondPage.body.data.total).toBe(totalAppointments);
    });

    it('cannot list appointments without auth', async () => {
      const res = await api.get('/appointments');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('cannot list appointments without "read:appointment" or "read:appointment:others"', async () => {
      const { cookies } = await createMember({ login: true });

      const res = await api.get(
        '/appointments',
        { page: 1, perPage: 10 },
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('patient only sees own appointments', async () => {
      const { patient: patientA, cookies: cookiesA } = await createPatient({
        login: true,
      });
      const { patient: patientB } = await createPatient();

      const dataSource = getTestDataSource();
      await createAppointment(dataSource, { patient: patientA });
      await createAppointment(dataSource, { patient: patientB });

      const res = await api.get<GetAppointmentsResponse>(
        '/appointments',
        { page: 1, perPage: 10 },
        { cookies: cookiesA },
      );

      expect(res.status).toBe(200);
      expect(res.body.data.appointments).toHaveLength(1);
      expect(res.body.data.appointments[0].patient.id).toBe(patientA.id);
      expect(res.body.data.total).toBe(1);
    });
  });

  describe('PUT /appointments/:id', () => {
    const dataToUpdate: UpdateAppointmentBody = {
      date: new Date(),
      condition: 'in_crisis',
      annotation: 'Eu dolor eu dolor culpa est mollit.',
    };

    it('updates an appointment', async () => {
      const { patient } = await createPatient();
      const { cookies } = await createMember({
        login: true,
        features: ['update:appointment:others'],
      });

      const dataSource = getTestDataSource();
      const appointment = await createAppointment(dataSource, {
        annotation: null,
        condition: 'stable',
        patient,
      });

      const res = await api.put<BaseResponseBody, UpdateAppointmentBody>(
        `/appointments/${appointment.id}`,
        dataToUpdate,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Atendimento atualizado com sucesso.');

      const updatedAppointment = await getAppointment(
        dataSource,
        appointment.id,
      );

      expect(updatedAppointment?.condition).toBe(dataToUpdate.condition);
      expect(updatedAppointment?.annotation).toBe(dataToUpdate.annotation);
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['update:appointment:others'],
      });

      const res = await api.put<BaseResponseBody, UpdateAppointmentBody>(
        '/appointments/non-existent-id',
        dataToUpdate,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Atendimento não encontrado.');
    });

    it('cannot update without auth', async () => {
      const res = await api.put('/appointments/sample-id');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('patient cannot update another patient appointment', async () => {
      const { cookies: cookiesA } = await createPatient({ login: true });
      const { patient: patientB } = await createPatient();

      const dataSource = getTestDataSource();
      const appointment = await createAppointment(dataSource, {
        patient: patientB,
      });

      const res = await api.put<BaseResponseBody, UpdateAppointmentBody>(
        `/appointments/${appointment.id}`,
        dataToUpdate,
        { cookies: cookiesA },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('cannot update appointment without "update:appointment"', async () => {
      const { cookies } = await createMember({ login: true });

      const res = await api.put<BaseResponseBody, UpdateAppointmentBody>(
        `/appointments/sample-id`,
        dataToUpdate,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('specialist cannot update another specialist appointment without "update:appointment:others"', async () => {
      const { patient } = await createPatient();
      const { specialist: specialistA } = await createSpecialist();
      const { cookies: specialistBCookies } = await createSpecialist({
        login: true,
      });

      const dataSource = getTestDataSource();
      const appointment = await createAppointment(dataSource, {
        patient,
        specialist: specialistA,
      });

      const res = await api.put<BaseResponseBody, UpdateAppointmentBody>(
        `/appointments/${appointment.id}`,
        dataToUpdate,
        { cookies: specialistBCookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });
  });

  describe('PATCH /appointments/:id/cancel', () => {
    it('cancels an appointment', async () => {
      const { patient } = await createPatient();
      const { cookies } = await createMember({
        login: true,
        features: ['cancel:appointment:others'],
      });

      const dataSource = getTestDataSource();
      const appointment = await createAppointment(dataSource, {
        status: 'scheduled',
        patient,
      });

      const res = await api.patch<BaseResponseBody>(
        `/appointments/${appointment.id}/cancel`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Atendimento cancelado com sucesso.');

      const updatedAppointment = await getAppointment(
        dataSource,
        appointment.id,
      );

      expect(updatedAppointment?.status).toBe('canceled');
    });

    it('allows patient to cancel its own appointment with "cancel:appointment"', async () => {
      const { patient, cookies } = await createPatient({
        login: true,
        features: ['cancel:appointment'],
      });

      const dataSource = getTestDataSource();
      const appointment = await createAppointment(dataSource, {
        status: 'scheduled',
        patient,
      });

      const res = await api.patch<BaseResponseBody>(
        `/appointments/${appointment.id}/cancel`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Atendimento cancelado com sucesso.');

      const updatedAppointment = await getAppointment(
        dataSource,
        appointment.id,
      );

      expect(updatedAppointment?.status).toBe('canceled');
    });

    it('allows specialist to cancel its own appointment with "cancel:appointment"', async () => {
      const { patient } = await createPatient();
      const { specialist, cookies } = await createSpecialist({
        login: true,
        features: ['cancel:appointment'],
      });

      const dataSource = getTestDataSource();
      const appointment = await createAppointment(dataSource, {
        status: 'scheduled',
        patient,
        specialist,
      });

      const res = await api.patch<BaseResponseBody>(
        `/appointments/${appointment.id}/cancel`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Atendimento cancelado com sucesso.');

      const updatedAppointment = await getAppointment(
        dataSource,
        appointment.id,
      );

      expect(updatedAppointment?.status).toBe('canceled');
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['cancel:appointment:others'],
      });

      const res = await api.patch<BaseResponseBody>(
        '/appointments/non-existent-id/cancel',
        undefined,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Atendimento não encontrado.');
    });

    it('cannot cancel without auth', async () => {
      const res = await api.patch('/appointments/sample-id/cancel');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('cannot cancel a non "scheduled" appointment', async () => {
      const { patient } = await createPatient();
      const { cookies } = await createMember({
        login: true,
        features: ['cancel:appointment:others'],
      });

      const dataSource = getTestDataSource();
      const appointment = await createAppointment(dataSource, {
        patient,
        status: 'completed',
      });

      const res = await api.patch<BaseResponseBody>(
        `/appointments/${appointment.id}/cancel`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Este atendimento não pode ser cancelado.');
    });

    it('cannot cancel appointment without "cancel:appointment" or "cancel:appointment:others"', async () => {
      const { cookies } = await createMember({ login: true });
      const { patient } = await createPatient();

      const dataSource = getTestDataSource();
      const appointment = await createAppointment(dataSource, { patient });

      const res = await api.patch<BaseResponseBody>(
        `/appointments/${appointment.id}/cancel`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('patient cannot cancel another patient appointment', async () => {
      const { patient: patientA } = await createPatient();
      const { cookies: cookiesB } = await createPatient({ login: true });

      const dataSource = getTestDataSource();
      const appointment = await createAppointment(dataSource, {
        patient: patientA,
      });

      const res = await api.patch<BaseResponseBody>(
        `/appointments/${appointment.id}/cancel`,
        undefined,
        { cookies: cookiesB },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('specialist cannot cancel other appointments without "cancel:appointment:others"', async () => {
      const { specialist: specialistA } = await createSpecialist();
      const { cookies: cookiesB } = await createSpecialist({
        login: true,
      });
      const { patient } = await createPatient();

      const dataSource = getTestDataSource();
      const appointment = await createAppointment(dataSource, {
        patient,
        specialist: specialistA,
      });

      const res = await api.patch<BaseResponseBody>(
        `/appointments/${appointment.id}/cancel`,
        undefined,
        { cookies: cookiesB },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });
  });
});
