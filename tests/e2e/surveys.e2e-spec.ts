import { INestApplication } from '@nestjs/common';

import type {
  CreateSurveyBody,
  GetSurveyResponse,
  GetSurveysResponse,
} from '@/app/http/surveys/surveys.dtos';
import { RequestSignatureUseCase } from '@/app/signature/use-cases/request-signature.use-case';
import { SendReminderSignatureUseCase } from '@/app/signature/use-cases/send-reminder-signature.use-case';

import {
  ApiClient,
  BaseResponseBody,
  createApiClient,
} from '../config/api-client';
import { createAdmin, createMember, createPatient } from '../config/helpers';
import { getTestApp } from '../config/setup-e2e';
import { createSurvey, getSurveys } from '../helpers/surveys';
import {
  createSurveySubmission,
  getSurveySubmissionById,
} from '../helpers/surveys-submissions';

describe('Surveys (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;

  beforeAll(() => {
    app = getTestApp();
    api = createApiClient(app);
  });

  function buildCompleteSurveyBody(token: string): CreateSurveyBody {
    return {
      token,
      aboutYou: {
        dateOfBirth: '1990-01-15',
        gender: 'female_cis',
        race: 'white',
        maritalStatus: 'single',
        addressCep: '01001000',
        addressState: 'SP',
        addressCity: 'São Paulo',
        addressStreet: 'Rua Exemplo',
        addressNumber: '123',
        addressNeighborhood: 'Centro',
        hasLivedElsewhere: false,
        livedElsewhereDescription: null,
        cpf: '52998224725',
        susId: null,
      },
      family: {
        numberOfChildren: 0,
        childrenAges: null,
        childrenSchoolSupportSituation: null,
        familyIncome: 'two',
        housingSituation: 'rented',
        householdSize: 2,
        houseRooms: 4,
        houseBathrooms: 1,
        homeAccessLevel: 'full',
        transportModes: ['public_transport'],
      },
      journey: {
        educationLevel: 'higher_education_complete',
        employmentStatus: 'employed_formal',
        studyInterruption: null,
        profession: 'Professor',
        jobTitle: 'Analista',
        salaryRange: 'between_one_and_two',
        dismissedAfterDiagnosis: null,
        changedProfession: false,
        changedProfessionTo: null,
        currentJobIsPcd: null,
        receivesSicknessBenefit: 'not_entitled',
        receivesBpcLoas: 'not_applicable',
      },
      diagnosis: {
        diagnosis: 'anti_aqp4_positive',
        firstCrisisSymptoms: ['vision_loss_one_eye'],
        affectedAreas: ['legs'],
        diagnosingDoctorName: null,
        diagnosisHospitalName: null,
        diagnosisHospitalCep: null,
        diagnosisHospitalState: null,
        diagnosisHospitalCity: null,
        diagnosisHospitalStreet: null,
        diagnosisDate: '2023-06-01',
        diagnosisDocument: null,
        currentNeurologist: null,
        currentTreatmentHospital: null,
        currentTreatmentHospitalCep: null,
        specialistsBeforeDiagnosis: ['neurologist'],
        timeToDiagnosis: 12,
        timeToDiagnosisUnit: 'weeks',
        suspectedMultipleSclerosis: null,
        otherSuspectedDiseases: null,
        crisesBeforeDiagnosis: 2,
        crisesSinceDiagnosis: 1,
        treatmentInHomeCity: 'lives_in_capital',
        hasNeurologistsInCity: null,
        crisisAction: 'reference_doctor',
      },
      followUp: {
        followUpSpecialties: ['neurologist'],
        otherFollowUpProfessionals: [],
        followUpHow: 'sus',
        hasHealthInsurance: false,
        nmoMedications: [],
        crisesAfterMedication: null,
        legalActionForMedication: 'no_sus',
        generalMedications: [],
        hasVisualAlteration: false,
        usesVisualCane: null,
        visualImpairmentAssistance: null,
        visualAssistiveTechnologies: [],
        usesWheelchair: false,
        hasMotorSequelae: false,
        motorImpairmentAssistance: null,
        walkingDistance: null,
        usesWalkingAid: false,
        bladderControl: 'yes',
        bowelFunction: 'daily',
        otherSequelae: null,
        psychologicalMedsBeforeNmo: false,
        psychologicalMedsAfterNmo: false,
        psychologicalDiagnosisAfterNmo: false,
        bloodType: null,
        hasOtherDisease: false,
        otherDiseaseDescription: null,
      },
      dailyLife: {
        familySupport: 'always',
        fatigue: 'sometimes',
        physicalActivity: 'no',
        physicalActivityType: null,
        exercisedBeforeNmo: false,
        exercisesBeforeNmo: null,
        informationSources: ['google_or_other_search_engines'],
        lifePerception: 'A vida é boa',
        dreams: 'Sonho em viajar',
        additionalInfo: '',
      },
      supportContacts: [
        {
          name: 'Contato de Suporte',
          kinship: 'parent',
          phone: '11988888888',
        },
      ],
    };
  }

  describe('POST /surveys/complete', () => {
    it('completes survey and triggers signature request', async () => {
      const { patient } = await createPatient();
      const submission = await createSurveySubmission({
        status: 'approved',
        surveyToken: '01900000-0000-7000-8000-000000000001',
        patient,
      });

      const signatureUseCase = app.get(RequestSignatureUseCase);
      const signatureSpy = jest.spyOn(signatureUseCase, 'execute');

      const res = await api.post<BaseResponseBody, CreateSurveyBody>(
        '/surveys/complete',
        buildCompleteSurveyBody(submission.surveyToken!),
      );

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Catalogação enviada com sucesso.');

      const updatedSubmission = await getSurveySubmissionById(submission.id);
      expect(updatedSubmission?.status).toBe('completed');

      const surveys = await getSurveys();
      expect(surveys.length).toBe(1);
      expect(surveys[0].status).toBe('pending_signature');

      expect(signatureSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            name: `Catalogação ABNMO - ${patient.name}`,
          }),
          signer: expect.objectContaining({
            fullName: patient.name,
            email: patient.email,
          }),
        }),
      );

      signatureSpy.mockRestore();
    });

    it('cannot complete survey with invalid token', async () => {
      const res = await api.post<BaseResponseBody, CreateSurveyBody>(
        '/surveys/complete',
        buildCompleteSurveyBody('01900000-0000-7000-8000-000000000000'),
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Token de catalogação inválido.');
    });

    it('cannot complete non-approved submission', async () => {
      const { patient } = await createPatient();
      const submission = await createSurveySubmission({
        status: 'pending_review',
        surveyToken: '01900000-0000-7000-8000-000000000002',
        patient,
      });

      const res = await api.post<BaseResponseBody, CreateSurveyBody>(
        '/surveys/complete',
        buildCompleteSurveyBody(submission.surveyToken!),
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Esta catalogação não está aprovada para preenchimento.',
      );
    });

    it('cannot complete already completed submission', async () => {
      const { patient } = await createPatient();
      const submission = await createSurveySubmission({
        status: 'completed',
        surveyToken: '01900000-0000-7000-8000-000000000003',
        patient,
      });

      const res = await api.post<BaseResponseBody, CreateSurveyBody>(
        '/surveys/complete',
        buildCompleteSurveyBody(submission.surveyToken!),
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Esta catalogação não está aprovada para preenchimento.',
      );
    });

    it('cannot complete survey when "CPF" is already registered', async () => {
      await createPatient({ cpf: '52998224725' });

      const { patient } = await createPatient();
      const submission = await createSurveySubmission({
        status: 'approved',
        surveyToken: '01900000-0000-7000-8000-000000000005',
        patient,
      });

      const res = await api.post<BaseResponseBody, CreateSurveyBody>(
        '/surveys/complete',
        buildCompleteSurveyBody(submission.surveyToken!),
      );

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Já existe uma conta cadastrada com este CPF.',
      );
    });
  });

  describe('GET /surveys', () => {
    it('paginates surveys correctly', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['read:survey:others'],
      });

      const totalSurveys = 15;
      for (let i = 0; i < totalSurveys; i++) {
        const { patient } = await createPatient();
        await createSurvey({ status: 'completed', patient });
      }

      const firstPage = await api.get<GetSurveysResponse>(
        '/surveys',
        { page: 1, perPage: 10 },
        { cookies },
      );

      expect(firstPage.status).toBe(200);
      expect(firstPage.body.data.surveys).toHaveLength(10);
      expect(firstPage.body.data.total).toBe(totalSurveys);

      const secondPage = await api.get<GetSurveysResponse>(
        '/surveys',
        { page: 2, perPage: 10 },
        { cookies },
      );

      expect(secondPage.status).toBe(200);
      expect(secondPage.body.data.surveys).toHaveLength(5);
      expect(secondPage.body.data.total).toBe(totalSurveys);
    });

    it('filters by status', async () => {
      const { cookies } = await createAdmin({ login: true });

      const { patient: patientA } = await createPatient();
      await createSurvey({ status: 'completed', patient: patientA });

      const { patient: patientB } = await createPatient();
      await createSurvey({ status: 'pending_signature', patient: patientB });

      const res = await api.get<GetSurveysResponse>(
        '/surveys',
        { page: 1, perPage: 10, status: 'pending_signature' },
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.data.surveys).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.surveys[0].status).toBe('pending_signature');
    });

    it('filters by date range', async () => {
      const { cookies } = await createAdmin({ login: true });

      const { patient } = await createPatient();
      await createSurvey({
        status: 'completed',
        createdAt: new Date(),
        patient,
      });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const res = await api.get<GetSurveysResponse>(
        '/surveys',
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
      expect(res.body.data.surveys[0].name).toBe(patient.name);
      expect(res.body.data.surveys[0].status).toBe('completed');
    });

    it('filters by search', async () => {
      const { cookies } = await createAdmin({ login: true });

      const { patient: patientA } = await createPatient();
      await createSurvey({ status: 'completed', patient: patientA });

      const { patient: patientB } = await createPatient({
        name: 'Search Survey',
      });
      await createSurvey({ status: 'completed', patient: patientB });

      const res = await api.get<GetSurveysResponse>(
        '/surveys',
        { page: 1, perPage: 10, search: 'sear' },
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.data.surveys).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.surveys[0].name).toBe('Search Survey');
      expect(res.body.data.surveys[0].email).toBe(patientB.email);
    });

    it('blocks user without "read:survey:others" feature', async () => {
      const { cookies } = await createMember({ login: true, features: [] });

      const res = await api.get(
        '/surveys',
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

  describe('GET /surveys/:id', () => {
    it('returns survey details', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['read:survey:others'],
      });

      const { patient } = await createPatient();
      const survey = await createSurvey({ status: 'completed', patient });

      const res = await api.get<GetSurveyResponse>(
        `/surveys/${survey.id}`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(survey.id);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.patient.name).toBe(patient.name);
      expect(res.body.data.patient.email).toBe(patient.email);
    });

    it('blocks user without "read:survey" or "read:survey:others" feature', async () => {
      const { cookies } = await createMember({ login: true, features: [] });

      const { patient } = await createPatient();
      const survey = await createSurvey({ patient });

      const res = await api.get(`/surveys/${survey.id}`, undefined, {
        cookies,
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Você não tem permissão para executar esta ação.',
      );
    });

    it('returns 404 for non-existent ID', async () => {
      const { cookies } = await createAdmin({ login: true });

      const res = await api.get(
        '/surveys/00000000-0000-0000-0000-000000000000',
        undefined,
        {
          cookies,
        },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Catalogação não encontrada.');
    });
  });

  describe('POST /surveys/:id/send-reminder', () => {
    it('sends reminder for "pending_signature" survey', async () => {
      const { cookies } = await createMember({
        login: true,
        features: ['read:survey:others'],
      });

      const signatureId = 'sig-123';
      const { patient } = await createPatient();
      const survey = await createSurvey({
        status: 'pending_signature',
        signatureId,
        patient,
      });

      const sendReminderUseCase = app.get(SendReminderSignatureUseCase);
      const spy = jest.spyOn(sendReminderUseCase, 'execute');

      const res = await api.post(
        `/surveys/${survey.id}/send-reminder`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Lembrete enviado com sucesso.');

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ signatureId }),
      );

      spy.mockRestore();
    });

    it('cannot send reminder when survey has no signature pending', async () => {
      const { cookies } = await createAdmin({ login: true });

      const { patient } = await createPatient();
      const survey = await createSurvey({
        status: 'pending_signature',
        signatureId: null,
        patient,
      });

      const res = await api.post(
        `/surveys/${survey.id}/send-reminder`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Nenhuma assinatura pendente para esta catalogação.',
      );
    });

    it('cannot send reminder for non-pending signature survey', async () => {
      const { cookies } = await createAdmin({ login: true });

      const { patient } = await createPatient();
      const survey = await createSurvey({
        status: 'completed',
        signatureId: 'sig-123',
        patient,
      });

      const res = await api.post(
        `/surveys/${survey.id}/send-reminder`,
        undefined,
        { cookies },
      );

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(
        'Nenhuma assinatura pendente para esta catalogação.',
      );
    });

    it('blocks user without "read:survey:others" feature', async () => {
      const { cookies } = await createMember({ login: true, features: [] });

      const res = await api.post(
        '/surveys/sample-id/send-reminder',
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

      const res = await api.post(
        '/surveys/00000000-0000-0000-0000-000000000000/send-reminder',
        undefined,
        { cookies },
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Catalogação não encontrada.');
    });
  });
});
