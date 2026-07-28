import { INestApplication } from '@nestjs/common';

import type {
  CreateReferralBody,
  GetReferralsResponse,
  UpdateReferralBody,
} from '@/app/http/referrals/referrals.dtos';

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
  createReferral,
  getReferralById,
  getReferrals,
} from '../helpers/referrals';

describe('Referrals (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;

  beforeAll(() => {
    app = getTestApp();
    api = createApiClient(app);
  });

  describe('POST /referrals', () => {
    const referralBody: CreateReferralBody = {
      annotation: null,
      category: 'nursing',
      condition: 'stable',
      date: new Date(),
      patientId: '01900000-0000-7000-8000-000000000000',
      professionalName: null,
    };

    it('creates a referral', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['create:referral'],
      });
      const { patient } = await createPatient();

      const res = await api.post<BaseResponseBody, CreateReferralBody>(
        '/referrals',
        { ...referralBody, patientId: patient.id },
        { cookies },
      );

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Encaminhamento cadastrado com sucesso.');

      const referrals = await getReferrals();

      expect(referrals.length).toBe(1);
      expect(referrals[0].patient.id).toBe(patient.id);
      expect(referrals[0].patient.name).toBe(patient.name);
      expect(referrals[0].patient.email).toBe(patient.email);
    });

    it('blocks user without "create:referral" feature', async () => {
      const { cookies } = await createMember({ login: true });

      const res = await api.post<BaseResponseBody, CreateReferralBody>(
        '/referrals',
        referralBody,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('cannot create a referral for a non-existent patient', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.post<BaseResponseBody, CreateReferralBody>(
        '/referrals',
        referralBody,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Paciente não encontrado.');
    });
  });

  describe('GET /referrals', () => {
    it('paginates referrals properly', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['read:referral:others'],
      });
      const { patient } = await createPatient();

      const totalReferrals = 15;
      for (let i = 0; i < totalReferrals; i++) {
        await createReferral({ patient });
      }

      const firstPage = await api.get<GetReferralsResponse>(
        '/referrals',
        { page: 1, perPage: 10 },
        { cookies },
      );

      expect(firstPage.status).toBe(200);
      expect(firstPage.body.data.referrals).toHaveLength(10);
      expect(firstPage.body.data.total).toBe(totalReferrals);

      const secondPage = await api.get<GetReferralsResponse>(
        '/referrals',
        { page: 2, perPage: 10 },
        { cookies },
      );

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.data.referrals).toHaveLength(5);
      expect(secondPage.body.data.total).toBe(totalReferrals);
    });

    it('blocks user without "read:referral" or "read:referral:others" feature', async () => {
      const { cookies } = await createMember({ login: true });

      const res = await api.get(
        '/referrals',
        { page: 1, perPage: 10 },
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('patient only sees own referrals', async () => {
      const { patient: patientA, cookies: cookiesA } = await createPatient({
        login: true,
      });
      const { patient: patientB } = await createPatient();

      await createReferral({ patient: patientA });
      await createReferral({ patient: patientB });

      const res = await api.get<GetReferralsResponse>(
        '/referrals',
        { page: 1, perPage: 10 },
        { cookies: cookiesA },
      );

      expect(res.status).toBe(200);
      expect(res.body.data.referrals).toHaveLength(1);
      expect(res.body.data.referrals[0].patient.id).toBe(patientA.id);
      expect(res.body.data.total).toBe(1);
    });
  });

  describe('PUT /referrals/:id', () => {
    const updateBody: UpdateReferralBody = {
      date: new Date(),
      condition: 'in_crisis',
      annotation: 'Eu dolor eu dolor culpa est mollit.',
    };

    it('updates a referral', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['update:referral:others'],
      });

      const { patient } = await createPatient();
      const referral = await createReferral({
        annotation: null,
        condition: 'stable',
        status: 'scheduled',
        patient,
      });

      const res = await api.put<BaseResponseBody, UpdateReferralBody>(
        `/referrals/${referral.id}`,
        updateBody,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Encaminhamento atualizado com sucesso.');

      const updatedReferral = await getReferralById(referral.id);

      expect(updatedReferral?.condition).toBe(updateBody.condition);
      expect(updatedReferral?.annotation).toBe(updateBody.annotation);
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.put<BaseResponseBody, UpdateReferralBody>(
        '/referrals/01900000-0000-7000-8000-000000000000',
        updateBody,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Encaminhamento não encontrado.');
    });

    it('patient cannot update another patient referral', async () => {
      const { cookies: cookiesA } = await createPatient({ login: true });
      const { patient: patientB } = await createPatient();

      const referral = await createReferral({
        patient: patientB,
      });

      const res = await api.put<BaseResponseBody, UpdateReferralBody>(
        `/referrals/${referral.id}`,
        updateBody,
        { cookies: cookiesA },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('blocks user without "update:referral" feature', async () => {
      const { cookies } = await createMember({ login: true });

      const res = await api.put<BaseResponseBody, UpdateReferralBody>(
        `/referrals/01900000-0000-7000-8000-000000000000`,
        updateBody,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('specialist cannot update another specialist referral without "update:referral:others" feature', async () => {
      const { patient } = await createPatient();
      const { specialist: specialistA } = await createSpecialist();
      const { cookies: specialistBCookies } = await createSpecialist({
        login: true,
      });

      const referral = await createReferral({
        patient,
        specialist: specialistA,
      });

      const res = await api.put<BaseResponseBody, UpdateReferralBody>(
        `/referrals/${referral.id}`,
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

  describe('PATCH /referrals/:id/cancel', () => {
    it('cancels a referral', async () => {
      const { patient } = await createPatient();
      const { cookies } = await createMember({
        login: true,
        features: ['cancel:referral:others'],
      });

      const referral = await createReferral({
        status: 'scheduled',
        patient,
      });

      const res = await api.patch(
        `/referrals/${referral.id}/cancel`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Encaminhamento cancelado com sucesso.');

      const updatedReferral = await getReferralById(referral.id);

      expect(updatedReferral?.status).toBe('canceled');
    });

    it('allows patient to cancel its own referral with "cancel:referral" feature', async () => {
      const { patient, cookies } = await createPatient({
        login: true,
        features: ['cancel:referral'],
      });

      const referral = await createReferral({
        status: 'scheduled',
        patient,
      });

      const res = await api.patch(
        `/referrals/${referral.id}/cancel`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Encaminhamento cancelado com sucesso.');

      const updatedReferral = await getReferralById(referral.id);

      expect(updatedReferral?.status).toBe('canceled');
    });

    it('allows specialist to cancel its own referral with "cancel:referral" feature', async () => {
      const { specialist, cookies } = await createSpecialist({
        login: true,
        features: ['cancel:referral'],
      });

      const { patient } = await createPatient();
      const referral = await createReferral({
        status: 'scheduled',
        patient,
        specialist,
      });

      const res = await api.patch(
        `/referrals/${referral.id}/cancel`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Encaminhamento cancelado com sucesso.');

      const updatedReferral = await getReferralById(referral.id);

      expect(updatedReferral?.status).toBe('canceled');
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.patch(
        '/referrals/01900000-0000-7000-8000-000000000000/cancel',
        undefined,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Encaminhamento não encontrado.');
    });

    it('cannot cancel a non-scheduled referral', async () => {
      const { patient } = await createPatient();
      const { cookies } = await createMember({
        login: true,
        features: ['cancel:referral:others'],
      });

      const referral = await createReferral({
        patient,
        status: 'completed',
      });

      const res = await api.patch(
        `/referrals/${referral.id}/cancel`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Este encaminhamento não pode ser cancelado.',
      );
    });

    it('blocks user without "cancel:referral" or "cancel:referral:others" feature', async () => {
      const { cookies } = await createMember({ login: true });
      const { patient } = await createPatient();

      const referral = await createReferral({ patient });

      const res = await api.patch(
        `/referrals/${referral.id}/cancel`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('patient cannot cancel another patient referral', async () => {
      const { patient: patientA } = await createPatient();
      const { cookies: cookiesB } = await createPatient({ login: true });

      const referral = await createReferral({
        patient: patientA,
      });

      const res = await api.patch(
        `/referrals/${referral.id}/cancel`,
        undefined,
        { cookies: cookiesB },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('specialist cannot cancel other referrals without "cancel:referral:others" feature', async () => {
      const { specialist: specialistA } = await createSpecialist();
      const { cookies: cookiesB } = await createSpecialist({
        login: true,
      });
      const { patient } = await createPatient();

      const referral = await createReferral({
        patient,
        specialist: specialistA,
      });

      const res = await api.patch(
        `/referrals/${referral.id}/cancel`,
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
