import { INestApplication } from '@nestjs/common';

import type {
  CreateSurveySubmissionBody,
  CreateSurveySubmissionResponse,
  GetSurveySubmissionResponse,
  GetSurveySubmissionsResponse,
  GetTotalSurveySubmissionsResponse,
} from '@/app/http/surveys/submissions/surveys.dtos';
import { MailService } from '@/app/mail/mail.service';

import { ApiClient, createApiClient } from '../config/api-client';
import { createAdmin, createMember, createPatient } from '../config/helpers';
import { getTestApp } from '../config/setup-e2e';
import { createDocument } from '../helpers/documents';
import {
  createSurveySubmission,
  getSurveySubmissionById,
} from '../helpers/surveys-submissions';

describe('Survey Submissions (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;

  beforeAll(() => {
    app = getTestApp();
    api = createApiClient(app);
  });

  describe('POST /survey-submissions', () => {
    const surveySubmissionData: CreateSurveySubmissionBody = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '11999999999',
      mimeType: 'application/pdf',
      fileSize: 1024,
    };

    it('creates survey submission', async () => {
      const res = await api.post<
        CreateSurveySubmissionResponse,
        CreateSurveySubmissionBody
      >('/survey-submissions', surveySubmissionData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.submissionId).toBeDefined();
      expect(res.body.data.key).toBeDefined();
      expect(res.body.data.url).toBeDefined();
      expect(res.body.data.fields).toBeDefined();
    });

    it('cannot create survey submission with email already registered', async () => {
      const { member } = await createMember();

      const res = await api.post('/survey-submissions', {
        ...surveySubmissionData,
        email: member.email,
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Já existe uma conta cadastrada com este e-mail.',
      );
    });

    it('cannot create survey submission when "fileSize" exceeds limit', async () => {
      const res = await api.post('/survey-submissions', {
        ...surveySubmissionData,
        fileSize: 7000000,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Os dados enviados são inválidos.');
    });

    it('cannot create survey submission when "mimeType" is invalid', async () => {
      const res = await api.post('/survey-submissions', {
        ...surveySubmissionData,
        mimeType: 'application/zip',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Os dados enviados são inválidos.');
    });

    it('cannot create survey submission when missing required fields', async () => {
      const res = await api.post('/survey-submissions', { name: 'Test User' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Os dados enviados são inválidos.');
    });
  });

  describe('POST /survey-submissions/:id/confirm-upload', () => {
    it('confirms upload and updates status to "pending_review"', async () => {
      const { patient } = await createPatient();
      const submission = await createSurveySubmission(patient, {
        status: 'pending_document',
      });

      await createDocument({ user: patient, submission });

      const res = await api.post(
        `/survey-submissions/${submission.id}/confirm-upload`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Documento confirmado com sucesso.');

      const updated = await getSurveySubmissionById(submission.id);
      expect(updated?.status).toBe('pending_review');
    });

    it('returns 404 for non-existent ID', async () => {
      const res = await api.post(
        '/survey-submissions/non-existent-id/confirm-upload',
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Catalogação não encontrada.');
    });
  });

  describe('GET /survey-submissions', () => {
    it('paginates submissions properly', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['read:survey:others'],
      });

      const totalSubmissions = 15;
      for (let i = 0; i < totalSubmissions; i++) {
        const { patient } = await createPatient();
        await createSurveySubmission(patient);
      }

      const firstPage = await api.get<GetSurveySubmissionsResponse>(
        '/survey-submissions',
        { page: 1, perPage: 10 },
        { cookies },
      );

      expect(firstPage.status).toBe(200);
      expect(firstPage.body.data.submissions).toHaveLength(10);
      expect(firstPage.body.data.total).toBe(totalSubmissions);

      const secondPage = await api.get<GetSurveySubmissionsResponse>(
        '/survey-submissions',
        { page: 2, perPage: 10 },
        { cookies },
      );

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.data.submissions).toHaveLength(5);
      expect(secondPage.body.data.total).toBe(totalSubmissions);
    });

    it('filters by status', async () => {
      const { cookies } = await createAdmin({ login: true });

      const { patient: patientA } = await createPatient();
      await createSurveySubmission(patientA, { status: 'pending_review' });

      const { patient: patientB } = await createPatient();
      await createSurveySubmission(patientB, { status: 'approved' });

      const res = await api.get<GetSurveySubmissionsResponse>(
        '/survey-submissions',
        { page: 1, perPage: 10, status: 'approved' },
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.data.submissions).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.submissions[0].status).toBe('approved');
    });

    it('filters by date range', async () => {
      const { cookies } = await createAdmin({ login: true });

      const { patient } = await createPatient();
      await createSurveySubmission(patient, { status: 'pending_review' });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const res = await api.get<GetSurveySubmissionsResponse>(
        '/survey-submissions',
        {
          page: 1,
          perPage: 10,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(1);
    });

    it('filters by search', async () => {
      const { cookies } = await createAdmin({ login: true });

      const { patient: patientA } = await createPatient({
        name: 'Searchable Name',
        email: 'searchable@example.com',
      });
      const { patient: patientB } = await createPatient({
        name: 'Other Patient',
        email: 'other@example.com',
      });

      await createSurveySubmission(patientA);
      await createSurveySubmission(patientB);

      const res = await api.get<GetSurveySubmissionsResponse>(
        '/survey-submissions',
        { page: 1, perPage: 10, search: 'searc' },
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.data.submissions).toHaveLength(1);
      expect(res.body.data.submissions[0].name).toBe('Searchable Name');
      expect(res.body.data.total).toBe(1);
    });

    it('cannot list submissions without "read:survey:others"', async () => {
      const { cookies } = await createMember({ login: true });

      const res = await api.get(
        '/survey-submissions',
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

  describe('GET /survey-submissions/total', () => {
    it('returns total count', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['read:survey:others'],
      });
      const { patient: patientA } = await createPatient();
      const { patient: patientB } = await createPatient();

      await createSurveySubmission(patientA, { status: 'pending_review' });
      await createSurveySubmission(patientB, { status: 'approved' });

      const res = await api.get<GetTotalSurveySubmissionsResponse>(
        '/survey-submissions/total',
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(2);
    });

    it('filters by status', async () => {
      const { cookies } = await createAdmin({ login: true });
      const { patient: patientA } = await createPatient();
      const { patient: patientB } = await createPatient();

      await createSurveySubmission(patientA, { status: 'pending_review' });
      await createSurveySubmission(patientB, { status: 'approved' });

      const res = await api.get<GetTotalSurveySubmissionsResponse>(
        '/survey-submissions/total',
        { status: 'pending_review' },
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(1);
    });

    it('cannot count submissions without "read:survey:others"', async () => {
      const { cookies } = await createMember({ login: true, features: [] });

      const res = await api.get('/survey-submissions/total', undefined, {
        cookies,
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });
  });

  describe('GET /survey-submissions/:id', () => {
    it('returns submission details', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['read:survey:others'],
      });

      const { patient } = await createPatient();
      const submission = await createSurveySubmission(patient);

      const res = await api.get<GetSurveySubmissionResponse>(
        `/survey-submissions/${submission.id}`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(submission.id);
      expect(res.body.data.name).toBe(patient.name);
      expect(res.body.data.email).toBe(patient.email);
      expect(res.body.data.status).toBe(submission.status);
    });

    it('cannot access without "read:survey" or "read:survey:others"', async () => {
      const { cookies } = await createMember({ login: true, features: [] });

      const { patient } = await createPatient();
      const submission = await createSurveySubmission(patient);

      const res = await api.get(
        `/survey-submissions/${submission.id}`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.get(
        '/survey-submissions/non-existent-id',
        undefined,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Submissão de catalogação não encontrada.');
    });
  });

  describe('PATCH /survey-submissions/:id/approve', () => {
    it('approves submission and sends email with token', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['approve:survey'],
      });

      const { patient } = await createPatient();
      const submission = await createSurveySubmission(patient, {
        status: 'pending_review',
      });

      const mailService = app.get(MailService);
      const mailSpy = jest.spyOn(mailService, 'send');

      const res = await api.patch(
        `/survey-submissions/${submission.id}/approve`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await getSurveySubmissionById(submission.id);

      expect(updated?.status).toBe('approved');
      expect(updated?.surveyToken).toBeDefined();
      expect(res.body).not.toHaveProperty('surveyToken');
      expect(res.body).not.toHaveProperty('data.surveyToken');

      expect(mailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: patient.email,
          subject: expect.any(String),
          html: expect.stringContaining(
            `/catalogacao/voce?token=${updated?.surveyToken}`,
          ),
        }),
      );

      mailSpy.mockRestore();
    });

    it('cannot approve submission when status it not "pending_review"', async () => {
      const { cookies } = await createAdmin({ login: true });

      const { patient } = await createPatient();
      const submission = await createSurveySubmission(patient, {
        status: 'approved',
      });

      const res = await api.patch(
        `/survey-submissions/${submission.id}/approve`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Somente submissões pendentes podem ser aprovadas.',
      );
    });

    it('cannot approve submission without "approve:survey"', async () => {
      const { cookies } = await createMember({ login: true, features: [] });

      const res = await api.patch(
        '/survey-submissions/sample-id/approve',
        undefined,
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.patch(
        '/survey-submissions/sample-id/approve',
        undefined,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Submissão de catalogação não encontrada.');
    });
  });

  describe('PATCH /survey-submissions/:id/decline', () => {
    it('declines submission with reason', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['approve:survey'],
      });

      const { patient } = await createPatient();
      const submission = await createSurveySubmission(patient, {
        status: 'pending_review',
      });

      const res = await api.patch(
        `/survey-submissions/${submission.id}/decline`,
        { reason: 'Documento inválido' },
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await getSurveySubmissionById(submission.id);

      expect(updated?.status).toBe('declined');
      expect(updated?.reason).toBe('Documento inválido');
    });

    it('must provide a reason', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.patch(
        '/survey-submissions/sample-id/decline',
        {},
        { cookies },
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Os dados enviados são inválidos.');
    });

    it('cannot decline submission when status is not "pending_review"', async () => {
      const { cookies } = await createAdmin({ login: true });

      const { patient } = await createPatient();
      const submission = await createSurveySubmission(patient, {
        status: 'approved',
      });

      const res = await api.patch(
        `/survey-submissions/${submission.id}/decline`,
        { reason: 'Documento inválido' },
        { cookies },
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Somente submissões pendentes podem ser recusadas.',
      );
    });

    it('cannot decline submission without "approve:survey"', async () => {
      const { cookies } = await createMember({ login: true, features: [] });

      const res = await api.patch(
        '/survey-submissions/sample-id/decline',
        { reason: 'Documento invalido' },
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.patch(
        '/survey-submissions/sample-id/decline',
        { reason: 'Documento inválido' },
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Submissão de catalogação não encontrada.');
    });
  });
});
