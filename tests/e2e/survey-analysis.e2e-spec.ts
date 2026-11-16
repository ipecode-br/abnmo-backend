import { INestApplication } from '@nestjs/common';

import type {
  GetSurveyAnalysesResponse,
  ReanalyzeSurveyAnswerBody,
  UpdateSurveyAnalysisTermsBody,
} from '@/app/http/surveys/analysis/survey-analysis.dtos';
import { EnqueueSurveyAnalysisUseCase } from '@/app/queue/use-cases/enqueue-survey-analysis.use-case';
import { SURVEY_ANALYSIS_QUESTIONS } from '@/constants/survey-analysis';
import type { SurveyAnalysisTerm } from '@/domain/schemas/surveys/analysis';

import {
  ApiClient,
  BaseResponseBody,
  createApiClient,
} from '../config/api-client';
import { createAdmin, createMember, createPatient } from '../config/helpers';
import { getTestApp } from '../config/setup-e2e';
import {
  createSurveyAnalysis,
  getSurveyAnalysisById,
} from '../helpers/survey-analyses';
import { createSurvey } from '../helpers/surveys';

describe('Survey analysis (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;

  beforeAll(() => {
    app = getTestApp();
    api = createApiClient(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /survey-analysis/:patientId', () => {
    it('returns patient analyses', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['read:survey:others'],
      });

      const { patient } = await createPatient();
      const analysis = await createSurveyAnalysis({
        patient,
        questionKey: 'dreams',
        model: 'gpt-5',
      });

      const res = await api.get<GetSurveyAnalysesResponse>(
        `/survey-analysis/${patient.id}`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Análises retornadas com sucesso.');
      expect(res.body.data.analyses).toHaveLength(1);
      expect(res.body.data.analyses[0].id).toBe(analysis.id);
      expect(res.body.data.analyses[0].questionKey).toBe('dreams');
      expect(res.body.data.analyses[0].model).toBe('gpt-5');
      expect(res.body.data.analyses[0].promptVersion).toBe('1');
      expect(res.body.data.analyses[0].terms).toEqual(analysis.terms);
    });

    it('returns empty list when patient has no analyses', async () => {
      const { cookies } = await createAdmin({ login: true });
      const { patient } = await createPatient();

      const res = await api.get<GetSurveyAnalysesResponse>(
        `/survey-analysis/${patient.id}`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.analyses).toHaveLength(0);
    });

    it('returns 400 for invalid patient ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.get('/survey-analysis/invalid-id', undefined, {
        cookies,
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Os dados enviados são inválidos.');
    });

    it('returns 404 when the patient does not exist', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.get(
        '/survey-analysis/01900000-0000-7000-8000-000000000000',
        undefined,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Paciente não encontrado.');
    });

    it('returns 404 when the ID belongs to a non-patient user', async () => {
      const { cookies } = await createAdmin({ login: true });
      const { member } = await createMember();

      const res = await api.get(`/survey-analysis/${member.id}`, undefined, {
        cookies,
      });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Paciente não encontrado.');
    });

    it('returns 401 without authentication', async () => {
      const { patient } = await createPatient();

      const res = await api.get(`/survey-analysis/${patient.id}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('blocks user without "read:survey:others" feature', async () => {
      const { cookies } = await createMember({ login: true, features: [] });
      const { patient } = await createPatient();

      const res = await api.get(`/survey-analysis/${patient.id}`, undefined, {
        cookies,
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });
  });

  describe('PATCH /survey-analysis/:id/terms', () => {
    const terms: SurveyAnalysisTerm[] = [
      { word: 'esperança', frequency: 2, sentiment: 'good', weight: 0.9 },
      { word: 'perda de esperança', frequency: 1, sentiment: 'bad', weight: 1 },
    ];

    it('updates analysis terms', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['update:survey:others'],
      });

      const { patient } = await createPatient();
      const analysis = await createSurveyAnalysis({ patient });

      const res = await api.patch<
        BaseResponseBody,
        UpdateSurveyAnalysisTermsBody
      >(`/survey-analysis/${analysis.id}/terms`, { terms }, { cookies });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Termos atualizados com sucesso.');

      const updated = await getSurveyAnalysisById(analysis.id);
      expect(updated?.terms).toEqual(terms);
    });

    it('removes all terms when empty array is sent', async () => {
      const { cookies } = await createAdmin({ login: true });

      const { patient } = await createPatient();
      const analysis = await createSurveyAnalysis({ patient });

      const res = await api.patch<
        BaseResponseBody,
        UpdateSurveyAnalysisTermsBody
      >(`/survey-analysis/${analysis.id}/terms`, { terms: [] }, { cookies });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await getSurveyAnalysisById(analysis.id);
      expect(updated?.terms).toEqual([]);
    });

    it('returns 400 for invalid term payload', async () => {
      const { cookies } = await createAdmin({ login: true });

      const { patient } = await createPatient();
      const analysis = await createSurveyAnalysis({ patient });

      const res = await api.patch(
        `/survey-analysis/${analysis.id}/terms`,
        {
          terms: [
            {
              word: 'esperança',
              frequency: 0,
              sentiment: 'unknown',
              weight: 2,
            },
          ],
        },
        { cookies },
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Os dados enviados são inválidos.');
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.patch(
        '/survey-analysis/01900000-0000-7000-8000-000000000000/terms',
        { terms },
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Análise não encontrada.');
    });

    it('blocks user without "update:survey:others" feature', async () => {
      const { cookies } = await createMember({ login: true, features: [] });

      const res = await api.patch(
        '/survey-analysis/01900000-0000-7000-8000-000000000000/terms',
        { terms },
        { cookies },
      );

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });
  });

  describe('POST /survey-analysis/reanalyze', () => {
    it('enqueues a new analysis for the answer', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['update:survey:others'],
      });

      const { patient } = await createPatient();
      await createSurvey({ patient, dreams: 'Sonho em viajar pelo mundo.' });

      const res = await api.post<
        BaseResponseBody,
        { patientId: string; questionKey: 'dreams' }
      >(
        '/survey-analysis/reanalyze',
        { patientId: patient.id, questionKey: 'dreams' },
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Nova análise solicitada com sucesso.');
      expect(
        app.get(EnqueueSurveyAnalysisUseCase).execute,
      ).toHaveBeenCalledWith({
        patientId: patient.id,
        questionKey: 'dreams',
        question: SURVEY_ANALYSIS_QUESTIONS.dreams,
        answer: 'Sonho em viajar pelo mundo.',
        model: 'gpt-5',
      });
    });

    it('enqueues with a custom model', async () => {
      const { cookies } = await createAdmin({ login: true });

      const { patient } = await createPatient();
      await createSurvey({
        patient,
        additionalInfo: 'Gostaria de acrescentar.',
      });

      const res = await api.post<BaseResponseBody, ReanalyzeSurveyAnswerBody>(
        '/survey-analysis/reanalyze',
        {
          patientId: patient.id,
          questionKey: 'additionalInfo',
          model: 'gpt-5-mini',
        },
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(
        app.get(EnqueueSurveyAnalysisUseCase).execute,
      ).toHaveBeenCalledWith(expect.objectContaining({ model: 'gpt-5-mini' }));
    });

    it('returns 404 when patient has no survey', async () => {
      const { cookies } = await createAdmin({ login: true });
      const { patient } = await createPatient();

      const res = await api.post(
        '/survey-analysis/reanalyze',
        { patientId: patient.id, questionKey: 'dreams' },
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Nenhuma catalogação encontrada para este paciente.',
      );
    });

    it('returns 400 when the answer is empty', async () => {
      const { cookies } = await createAdmin({ login: true });

      const { patient } = await createPatient();
      await createSurvey({ patient, dreams: '   ' });

      const res = await api.post(
        '/survey-analysis/reanalyze',
        { patientId: patient.id, questionKey: 'dreams' },
        { cookies },
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'A resposta para esta pergunta está vazia.',
      );
    });

    it('returns 400 for invalid payload', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.post(
        '/survey-analysis/reanalyze',
        { patientId: 'invalid', questionKey: 'unknown', model: 'unknown' },
        { cookies },
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Os dados enviados são inválidos.');
    });

    it('blocks user without "update:survey:others" feature', async () => {
      const { cookies } = await createMember({ login: true, features: [] });

      const res = await api.post(
        '/survey-analysis/reanalyze',
        {
          patientId: '01900000-0000-7000-8000-000000000000',
          questionKey: 'dreams',
        },
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
