import {
  DiagnosisSurveySchema,
  diagnosisSurveySchema,
} from '@/domain/schemas/surveys/requests/diagnosis';

const makePayload = (overrides?: Partial<DiagnosisSurveySchema>) => ({
  diagnosis: 'anti_aqp4_positive',
  firstCrisisSymptoms: ['vomiting'],
  affectedAreas: ['vision'],
  diagnosingDoctorName: 'Dr. Silva',
  diagnosisHospitalName: null,
  diagnosisHospitalCep: null,
  diagnosisHospitalState: null,
  diagnosisHospitalCity: null,
  diagnosisHospitalStreet: null,
  diagnosisDate: '2023-01-15',
  diagnosisDocument: null,
  currentNeurologist: null,
  currentTreatmentHospital: null,
  currentTreatmentHospitalCep: null,
  specialistsBeforeDiagnosis: ['neurologist'],
  timeToDiagnosis: 30,
  timeToDiagnosisUnit: 'days',
  suspectedMultipleSclerosis: null,
  otherSuspectedDiseases: null,
  crisesBeforeDiagnosis: null,
  crisesSinceDiagnosis: null,
  treatmentInHomeCity: 'lives_in_capital',
  hasNeurologistsInCity: null,
  crisisAction: 'reference_hospital',
  ...overrides,
});

describe('diagnosisSurveySchema', () => {
  describe('happy path', () => {
    it('accepts null "diagnosisHospitalName" with all hospital fields null', () => {
      const result = diagnosisSurveySchema.safeParse(makePayload());
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

  describe('"diagnosisHospitalName" is provided', () => {
    it('rejects null "diagnosisHospitalState"', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({
          diagnosisHospitalName: 'Hospital X',
          diagnosisHospitalState: null,
          diagnosisHospitalCity: 'City',
        }),
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
        makePayload({
          diagnosisHospitalName: 'Hospital X',
          diagnosisHospitalState: 'SP',
          diagnosisHospitalCity: null,
        }),
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

    it('returns both errors when state and city are null', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({
          diagnosisHospitalName: 'Hospital X',
          diagnosisHospitalState: null,
          diagnosisHospitalCity: null,
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('diagnosisHospitalState');
        expect(paths).toContain('diagnosisHospitalCity');
      }
    });

    it('allows "diagnosisHospitalCep" and "diagnosisHospitalStreet" to remain null', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({
          diagnosisHospitalName: 'Hospital X',
          diagnosisHospitalState: 'SP',
          diagnosisHospitalCity: 'City',
          diagnosisHospitalCep: null,
          diagnosisHospitalStreet: null,
        }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe('"diagnosisHospitalName" is not provided', () => {
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

  describe('"diagnosisDate"', () => {
    it('rejects an invalid ISO date', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ diagnosisDate: 'not-a-date' }),
      );
      expect(result.success).toBe(false);
    });
  });

  describe('"firstCrisisSymptoms"', () => {
    it('rejects an empty array', () => {
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
  });

  describe('"affectedAreas"', () => {
    it('rejects an empty array', () => {
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
  });

  describe('"specialistsBeforeDiagnosis"', () => {
    it('rejects an empty array', () => {
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
  });

  describe('"timeToDiagnosis"', () => {
    it('rejects a negative value', () => {
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

  describe('required fields', () => {
    it('rejects when "diagnosis" is missing', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ diagnosis: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "firstCrisisSymptoms" is missing', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ firstCrisisSymptoms: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "affectedAreas" is missing', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ affectedAreas: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "diagnosisDate" is missing', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ diagnosisDate: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "specialistsBeforeDiagnosis" is missing', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ specialistsBeforeDiagnosis: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "timeToDiagnosis" is missing', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ timeToDiagnosis: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "timeToDiagnosisUnit" is missing', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ timeToDiagnosisUnit: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "treatmentInHomeCity" is missing', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ treatmentInHomeCity: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "crisisAction" is missing', () => {
      const result = diagnosisSurveySchema.safeParse(
        makePayload({ crisisAction: undefined }),
      );
      expect(result.success).toBe(false);
    });
  });
});
