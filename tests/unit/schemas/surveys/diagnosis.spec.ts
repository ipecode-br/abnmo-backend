import {
  DiagnosisSurveySchema,
  diagnosisSurveySchema,
} from '@/domain/schemas/surveys/requests/diagnosis';

// Valid base payload
const makePayload = (overrides?: Partial<DiagnosisSurveySchema>) => ({
  diagnosis: 'anti_aqp4_positive',
  firstCrisisSymptoms: ['vomiting'],
  affectedAreas: ['vision'],
  diagnosingDoctorName: 'José da Silva',
  diagnosisHospitalName: 'Hospital das Clínicas',
  diagnosisHospitalCep: '00000000',
  diagnosisHospitalState: 'BA',
  diagnosisHospitalCity: 'Salvador',
  diagnosisHospitalStreet: 'Avenida Brasil',
  diagnosisDate: '2023-01-15',
  diagnosisDocument: 'Hemograma',
  currentNeurologist: 'Dráuzio Varela',
  currentTreatmentHospital: 'Hospital da Cidade',
  currentTreatmentHospitalCep: '00000000',
  specialistsBeforeDiagnosis: ['neurologist'],
  timeToDiagnosis: 30,
  timeToDiagnosisUnit: 'days',
  suspectedMultipleSclerosis: true,
  otherSuspectedDiseases: 'Diabetes',
  crisesBeforeDiagnosis: 2,
  crisesSinceDiagnosis: 3,
  treatmentInHomeCity: 'lives_in_capital',
  hasNeurologistsInCity: true,
  crisisAction: 'reference_hospital',
  ...overrides,
});

describe('diagnosisSurveySchema', () => {
  describe('Happy path', () => {
    it('accepts null "diagnosisHospitalName" with all hospital fields null', () => {
      const result = diagnosisSurveySchema.safeParse(makePayload());
      expect(result.success).toBe(true);
    });

    it('accepts null "diagnosingDoctorName"', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ diagnosingDoctorName: null }),
      );
      expect(result.success).toBe(true);
    });

    it('accepts "diagnosisHospitalName" provided with state and city', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({
          diagnosisHospitalName: 'Hospital das Clínicas',
          diagnosisHospitalState: 'SP',
          diagnosisHospitalCity: 'São Paulo',
        }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe('When "diagnosisHospitalName" is provided', () => {
    it('accepts null "diagnosisHospitalName" with null related fields', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({
          diagnosisHospitalName: null,
          diagnosisHospitalState: null,
          diagnosisHospitalCity: null,
          diagnosisHospitalCep: null,
          diagnosisHospitalStreet: null,
        }),
      );
      expect(result.success).toBe(true);
    });

    it('allows "diagnosisHospitalCep" and "diagnosisHospitalStreet" to remain null', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({
          diagnosisHospitalCep: null,
          diagnosisHospitalStreet: null,
        }),
      );
      expect(result.success).toBe(true);
    });

    it('rejects null "diagnosisHospitalState"', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ diagnosisHospitalState: null }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'diagnosisHospitalState',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('required');
      }
    });

    it('rejects null "diagnosisHospitalCity"', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ diagnosisHospitalCity: null }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'diagnosisHospitalCity',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('required');
      }
    });
  });

  describe('When "diagnosisHospitalName" is not provided', () => {
    it('rejects non-null "diagnosisHospitalState"', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({
          diagnosisHospitalName: null,
          diagnosisHospitalState: 'SP',
          diagnosisHospitalCity: null,
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'diagnosisHospitalState',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must be null');
      }
    });

    it('rejects non-null "diagnosisHospitalCity"', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({
          diagnosisHospitalName: null,
          diagnosisHospitalState: null,
          diagnosisHospitalCity: 'São Paulo',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'diagnosisHospitalCity',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must be null');
      }
    });

    it('rejects non-null "diagnosisHospitalCep"', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({
          diagnosisHospitalName: null,
          diagnosisHospitalCep: '12345678',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'diagnosisHospitalCep',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must be null');
      }
    });

    it('rejects non-null "diagnosisHospitalStreet"', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({
          diagnosisHospitalName: null,
          diagnosisHospitalStreet: 'Rua A',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'diagnosisHospitalStreet',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must be null');
      }
    });

    it('returns all 4 errors when hospital name is null but all address fields are non-null', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({
          diagnosisHospitalName: null,
          diagnosisHospitalState: 'SP',
          diagnosisHospitalCity: 'City',
          diagnosisHospitalCep: '12345678',
          diagnosisHospitalStreet: 'Rua A',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('diagnosisHospitalState');
        expect(paths).toContain('diagnosisHospitalCity');
        expect(paths).toContain('diagnosisHospitalCep');
        expect(paths).toContain('diagnosisHospitalStreet');
      }
    });
  });

  describe('Invalid types or values', () => {
    it('rejects "diagnosisDate" with an invalid ISO date', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ diagnosisDate: 'not-a-date' }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects "firstCrisisSymptoms" with an empty array', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ firstCrisisSymptoms: [] }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'firstCrisisSymptoms',
        );
        expect(issue).toBeDefined();
      }
    });

    it('rejects "affectedAreas" with an empty array', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ affectedAreas: [] }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'affectedAreas',
        );
        expect(issue).toBeDefined();
      }
    });

    it('rejects "specialistsBeforeDiagnosis" with an empty array', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ specialistsBeforeDiagnosis: [] }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'specialistsBeforeDiagnosis',
        );
        expect(issue).toBeDefined();
      }
    });

    it('rejects "timeToDiagnosis" with a negative value', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ timeToDiagnosis: -1 }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'timeToDiagnosis',
        );
        expect(issue).toBeDefined();
      }
    });
  });

  describe('Reject empty strings', () => {
    const fieldsCannotBeEmpty = [
      'diagnosingDoctorName',
      'diagnosisHospitalName',
      'diagnosisHospitalCep',
      'diagnosisHospitalState',
      'diagnosisHospitalCity',
      'diagnosisHospitalStreet',
      'diagnosisDocument',
      'currentNeurologist',
      'currentTreatmentHospital',
      'currentTreatmentHospitalCep',
      'otherSuspectedDiseases',
    ];

    it.each(fieldsCannotBeEmpty)(
      'rejects when "%s" is an empty string',
      (field) => {
        const result = diagnosisSurveySchema.safeParse(
          makePayload({ [field]: '' }),
        );
        expect(result.success).toBe(false);

        if (!result.success) {
          const issue = result.error.issues.find((i) => i.path[0] === field);
          expect(issue).toBeDefined();
        }
      },
    );
  });

  describe('Missing required fields', () => {
    const requiredFields = [
      'diagnosis',
      'firstCrisisSymptoms',
      'affectedAreas',
      'diagnosisDate',
      'specialistsBeforeDiagnosis',
      'timeToDiagnosis',
      'timeToDiagnosisUnit',
      'treatmentInHomeCity',
      'crisisAction',
    ];

    it.each(requiredFields)('rejects when "%s" is missing', (field) => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ [field]: undefined }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === field);
        expect(issue).toBeDefined();
      }
    });
  });
});
