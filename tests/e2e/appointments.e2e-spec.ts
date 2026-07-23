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
  createAdmin,
  createMember,
  createPatient,
  createSpecialist,
} from '../config/helpers';
import { getTestApp } from '../config/setup-e2e';
import {
  createAppointment,
  getAppointmentById,
  getAppointments,
} from '../helpers/appointments';

describe('Appointments (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;

  beforeAll(() => {
    app = getTestApp();
    api = createApiClient(app);
  });

  describe('POST /appointments', () => {
    const createBody: CreateAppointmentBody = {
      annotation: null,
      category: 'nursing',
      condition: 'stable',
      date: new Date(),
      patientId: '01900000-0000-7000-8000-000000000000',
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
        { ...createBody, patientId: patient.id },
        { cookies },
      );

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Atendimento cadastrado com sucesso.');

      const appointments = await getAppointments();

      expect(appointments.length).toBe(1);
      expect(appointments[0].patient.id).toBe(patient.id);
      expect(appointments[0].patient.name).toBe(patient.name);
      expect(appointments[0].patient.email).toBe(patient.email);
    });

    it('blocks user without "create:appointment" feature', async () => {
      const { cookies } = await createMember({ login: true });

      const res = await api.post<BaseResponseBody, CreateAppointmentBody>(
        '/appointments',
        createBody,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('cannot create an appointment for a non-existent patient', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.post<BaseResponseBody, CreateAppointmentBody>(
        '/appointments',
        createBody,
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

      const totalAppointments = 15;
      for (let i = 0; i < totalAppointments; i++) {
        await createAppointment({ patient });
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

    it('blocks user without "read:appointment" or "read:appointment:others" feature', async () => {
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

      await createAppointment({ patient: patientA });
      await createAppointment({ patient: patientB });

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
    const updateBody: UpdateAppointmentBody = {
      date: new Date(),
      condition: 'in_crisis',
      annotation: 'Eu dolor eu dolor culpa est mollit.',
    };

    it('updates an appointment', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['update:appointment:others'],
      });

      const { patient } = await createPatient();
      const appointment = await createAppointment({
        annotation: null,
        condition: 'stable',
        status: 'scheduled',
        patient,
      });

      const res = await api.put<BaseResponseBody, UpdateAppointmentBody>(
        `/appointments/${appointment.id}`,
        updateBody,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Atendimento atualizado com sucesso.');

      const updatedAppointment = await getAppointmentById(appointment.id);

      expect(updatedAppointment?.condition).toBe(updateBody.condition);
      expect(updatedAppointment?.annotation).toBe(updateBody.annotation);
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.put<BaseResponseBody, UpdateAppointmentBody>(
        '/appointments/00000000-0000-0000-0000-000000000000',
        updateBody,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Atendimento não encontrado.');
    });

    it('patient cannot update another patient appointment', async () => {
      const { cookies: cookiesA } = await createPatient({ login: true });
      const { patient: patientB } = await createPatient();

      const appointment = await createAppointment({ patient: patientB });

      const res = await api.put<BaseResponseBody, UpdateAppointmentBody>(
        `/appointments/${appointment.id}`,
        updateBody,
        { cookies: cookiesA },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('blocks user without "update:appointment" feature', async () => {
      const { cookies } = await createMember({ login: true });

      const res = await api.put<BaseResponseBody, UpdateAppointmentBody>(
        `/appointments/sample-id`,
        updateBody,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('specialist cannot update another specialist appointment without "update:appointment:others" feature', async () => {
      const { patient } = await createPatient();
      const { specialist: specialistA } = await createSpecialist();
      const { cookies: specialistBCookies } = await createSpecialist({
        login: true,
      });

      const appointment = await createAppointment({
        patient,
        specialist: specialistA,
      });

      const res = await api.put<BaseResponseBody, UpdateAppointmentBody>(
        `/appointments/${appointment.id}`,
        updateBody,
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

      const appointment = await createAppointment({
        status: 'scheduled',
        patient,
      });

      const res = await api.patch(
        `/appointments/${appointment.id}/cancel`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Atendimento cancelado com sucesso.');

      const updatedAppointment = await getAppointmentById(appointment.id);

      expect(updatedAppointment?.status).toBe('canceled');
    });

    it('allows patient to cancel its own appointment with "cancel:appointment" feature', async () => {
      const { patient, cookies } = await createPatient({
        login: true,
        features: ['cancel:appointment'],
      });

      const appointment = await createAppointment({
        status: 'scheduled',
        patient,
      });

      const res = await api.patch(
        `/appointments/${appointment.id}/cancel`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Atendimento cancelado com sucesso.');

      const updatedAppointment = await getAppointmentById(appointment.id);

      expect(updatedAppointment?.status).toBe('canceled');
    });

    it('allows specialist to cancel its own appointment with "cancel:appointment" feature', async () => {
      const { patient } = await createPatient();
      const { specialist, cookies } = await createSpecialist({
        login: true,
        features: ['cancel:appointment'],
      });

      const appointment = await createAppointment({
        status: 'scheduled',
        patient,
        specialist,
      });

      const res = await api.patch(
        `/appointments/${appointment.id}/cancel`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Atendimento cancelado com sucesso.');

      const updatedAppointment = await getAppointmentById(appointment.id);

      expect(updatedAppointment?.status).toBe('canceled');
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.patch(
        '/appointments/00000000-0000-0000-0000-000000000000/cancel',
        undefined,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Atendimento não encontrado.');
    });

    it('cannot cancel a non-scheduled appointment', async () => {
      const { cookies } = await createAdmin({ login: true });

      const { patient } = await createPatient();
      const appointment = await createAppointment({
        patient,
        status: 'completed',
      });

      const res = await api.patch(
        `/appointments/${appointment.id}/cancel`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Este atendimento não pode ser cancelado.');
    });

    it('blocks user without "cancel:appointment" or "cancel:appointment:others" feature', async () => {
      const { cookies } = await createMember({ login: true });
      const { patient } = await createPatient();

      const appointment = await createAppointment({ patient });

      const res = await api.patch(
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

      const appointment = await createAppointment({ patient: patientA });

      const res = await api.patch(
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

    it('specialist cannot cancel other appointments without "cancel:appointment:others" feature', async () => {
      const { specialist: specialistA } = await createSpecialist();
      const { cookies: cookiesB } = await createSpecialist({
        login: true,
      });
      const { patient } = await createPatient();

      const appointment = await createAppointment({
        patient,
        specialist: specialistA,
      });

      const res = await api.patch(
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
