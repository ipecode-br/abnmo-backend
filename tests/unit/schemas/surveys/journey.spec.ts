import { EMPLOYMENT_STATUSES_WITH_DETAILS_REQUIRED } from '@/domain/enums/surveys';
import {
  JourneySurveySchema,
  journeySurveySchema,
} from '@/domain/schemas/surveys/requests/journey';

// Valid base payload
const makePayload = (overrides?: Partial<JourneySurveySchema>) => ({
  educationLevel: 'high_school_complete',
  employmentStatus: 'unemployed',
  studyInterruption: null,
  profession: null,
  jobTitle: null,
  salaryRange: 'one',
  dismissedAfterDiagnosis: null,
  changedProfession: false,
  changedProfessionTo: null,
  currentJobIsPcd: null,
  receivesSicknessBenefit: 'not_receiving',
  receivesBpcLoas: 'not_applicable',
  ...overrides,
});

// educationLevel: z.enum(EDUCATION_LEVELS),
// employmentStatus: z.enum(EMPLOYMENT_STATUSES),
// studyInterruption: z.enum(STUDY_INTERRUPTION_SITUATIONS).nullable(),
// profession: z.string().min(1).nullable(),
// jobTitle: z.string().min(1).nullable(),
// salaryRange: z.enum(SALARY_RANGES),
// dismissedAfterDiagnosis: z.boolean().nullable(),
// changedProfession: z.boolean().nullable(),
// changedProfessionTo: z.string().min(1).nullable(),
// currentJobIsPcd: z.boolean().nullable(),
// receivesSicknessBenefit: z.enum(SICKNESS_BENEFIT_STATUSES),
// receivesBpcLoas: z.enum(BPC_LOAS_STATUSES),

describe('journeySurveySchema', () => {
  describe('Happy path', () => {
    it('accepts non-student, non-detail status with null optional fields', () => {
      const result = journeySurveySchema.safeParse(makePayload());
      expect(result.success).toBe(true);
    });

    it('accepts "employmentStatus" = "student" with valid "studyInterruption"', () => {
      const result = journeySurveySchema.safeParse(
        makePayload({
          employmentStatus: 'student',
          studyInterruption: 'did_not_interrupt',
        }),
      );
      expect(result.success).toBe(true);
    });

    it('accepts "changedProfession" = "true" with valid "changedProfessionTo"', () => {
      const result = journeySurveySchema.safeParse(
        makePayload({
          changedProfession: true,
          changedProfessionTo: 'Developer',
        }),
      );
      expect(result.success).toBe(true);
    });

    it.each(EMPLOYMENT_STATUSES_WITH_DETAILS_REQUIRED)(
      'accepts "employmentStatus" = "%s" with "profession" and "jobTitle"',
      (status) => {
        const result = journeySurveySchema.safeParse(
          makePayload({
            employmentStatus: status,
            profession: 'Engineer',
            jobTitle: 'Senior Engineer',
          }),
        );
        expect(result.success).toBe(true);
      },
    );
  });

  describe('When "employmentStatus" is "student"', () => {
    it('rejects null "studyInterruption"', () => {
      const result = journeySurveySchema.safeParse(
        makePayload({ employmentStatus: 'student', studyInterruption: null }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'studyInterruption',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('required');
      }
    });
  });

  describe('When "employmentStatus" is NOT "student"', () => {
    it('rejects non-null "studyInterruption"', () => {
      const result = journeySurveySchema.safeParse(
        makePayload({
          employmentStatus: 'retired',
          studyInterruption: 'interrupted_returned',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'studyInterruption',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must be null');
      }
    });

    it('accepts null "studyInterruption"', () => {
      const result = journeySurveySchema.safeParse(
        makePayload({ employmentStatus: 'bpc_loas', studyInterruption: null }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe('When "employmentStatus" requires details', () => {
    it.each(EMPLOYMENT_STATUSES_WITH_DETAILS_REQUIRED)(
      'rejects null "profession" for "%s"',
      (status) => {
        const result = journeySurveySchema.safeParse(
          makePayload({
            employmentStatus: status,
            profession: null,
            jobTitle: 'Engineer',
          }),
        );
        expect(result.success).toBe(false);

        if (!result.success) {
          const issue = result.error.issues.find(
            (i) => i.path[0] === 'profession',
          );
          expect(issue).toBeDefined();
          expect(issue!.message).toContain('required');
        }
      },
    );

    it.each(EMPLOYMENT_STATUSES_WITH_DETAILS_REQUIRED)(
      'rejects null "jobTitle" for "%s"',
      (status) => {
        const result = journeySurveySchema.safeParse(
          makePayload({
            employmentStatus: status,
            profession: 'Engineer',
            jobTitle: null,
          }),
        );
        expect(result.success).toBe(false);

        if (!result.success) {
          const issue = result.error.issues.find(
            (i) => i.path[0] === 'jobTitle',
          );
          expect(issue).toBeDefined();
          expect(issue!.message).toContain('required');
        }
      },
    );

    it('rejects "profession" with an empty string when required', () => {
      const result = journeySurveySchema.safeParse(
        makePayload({
          employmentStatus: 'employed_formal',
          profession: '',
          jobTitle: 'Engineer',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'profession',
        );
        expect(issue).toBeDefined();
      }
    });

    it('rejects "jobTitle" with an empty string when required', () => {
      const result = journeySurveySchema.safeParse(
        makePayload({
          employmentStatus: 'employed_formal',
          profession: 'Engineer',
          jobTitle: '',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'jobTitle');
        expect(issue).toBeDefined();
      }
    });
  });

  describe('When "employmentStatus" does NOT require details', () => {
    it('rejects non-null "profession"', () => {
      const result = journeySurveySchema.safeParse(
        makePayload({
          employmentStatus: 'unemployed',
          profession: 'Engineer',
          jobTitle: null,
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'profession',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must be null');
      }
    });

    it('rejects non-null "jobTitle"', () => {
      const result = journeySurveySchema.safeParse(
        makePayload({
          employmentStatus: 'retired_disability',
          profession: null,
          jobTitle: 'Manager',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'jobTitle');
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must be null');
      }
    });
  });

  describe('When "changedProfession" is "true"', () => {
    it('rejects null "changedProfessionTo"', () => {
      const result = journeySurveySchema.safeParse(
        makePayload({ changedProfession: true, changedProfessionTo: null }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'changedProfessionTo',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('required');
      }
    });

    it('rejects empty string "changedProfessionTo"', () => {
      const result = journeySurveySchema.safeParse(
        makePayload({ changedProfession: true, changedProfessionTo: '' }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'changedProfessionTo',
        );
        expect(issue).toBeDefined();
      }
    });
  });

  describe('When "changedProfession" is NOT "true"', () => {
    it('accepts null "changedProfessionTo" when "changedProfession" is "false"', () => {
      const result = journeySurveySchema.safeParse(
        makePayload({ changedProfession: false, changedProfessionTo: null }),
      );
      expect(result.success).toBe(true);
    });

    it('accepts null "changedProfessionTo" when "changedProfession" is null', () => {
      const result = journeySurveySchema.safeParse(
        makePayload({ changedProfession: null, changedProfessionTo: null }),
      );
      expect(result.success).toBe(true);
    });

    it('rejects non-null "changedProfessionTo" when "changedProfession" is "false"', () => {
      const result = journeySurveySchema.safeParse(
        makePayload({
          changedProfession: false,
          changedProfessionTo: 'Teacher',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'changedProfessionTo',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must be null');
      }
    });

    it('rejects non-null "changedProfessionTo" when "changedProfession" is null', () => {
      const result = journeySurveySchema.safeParse(
        makePayload({
          changedProfession: null,
          changedProfessionTo: 'Teacher',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'changedProfessionTo',
        );
        expect(issue).toBeDefined();
      }
    });
  });

  describe('Reject empty strings', () => {
    const fieldsCannotBeEmpty = [
      'profession',
      'jobTitle',
      'changedProfessionTo',
    ];

    it.each(fieldsCannotBeEmpty)(
      'rejects when "%s" is an empty string',
      (field) => {
        const result = journeySurveySchema.safeParse(
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
      'educationLevel',
      'employmentStatus',
      'salaryRange',
      'receivesSicknessBenefit',
      'receivesBpcLoas',
    ];

    it.each(requiredFields)('rejects when "%s" is missing', (field) => {
      const result = journeySurveySchema.safeParse(
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
