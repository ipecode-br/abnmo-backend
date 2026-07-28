import { PHYSICAL_ACTIVITY_FREQUENCIES } from '@/domain/enums/surveys';
import {
  DailyLifeSurveySchema,
  dailyLifeSurveySchema,
} from '@/domain/schemas/surveys/requests/daily-life';

// Valid base payload
const makePayload = (overrides?: Partial<DailyLifeSurveySchema>) => ({
  familySupport: 'sometimes',
  fatigue: 'sometimes',
  physicalActivity: 'no',
  physicalActivityType: null,
  exercisedBeforeNmo: false,
  exercisesBeforeNmo: null,
  informationSources: ['with_my_doctor'],
  lifePerception: 'I feel hopeful',
  dreams: 'Travel more',
  additionalInfo: '',
  ...overrides,
});

describe('dailyLifeSurveySchema', () => {
  describe('happy path', () => {
    it('accepts "physicalActivity" = "no" with null "physicalActivityType"', () => {
      const result = dailyLifeSurveySchema.safeParse(makePayload());
      expect(result.success).toBe(true);
    });

    it('accepts "physicalActivity" = "one_week" with valid "physicalActivityType"', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({
          physicalActivity: 'one_week',
          physicalActivityType: 'walking',
        }),
      );
      expect(result.success).toBe(true);
    });

    it('accepts "exercisedBeforeNmo" = "true" with valid "exercisesBeforeNmo"', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({
          exercisedBeforeNmo: true,
          exercisesBeforeNmo: 'walking_1_or_2',
        }),
      );
      expect(result.success).toBe(true);
    });

    it('accepts "exercisedBeforeNmo" = "false" with null "exercisesBeforeNmo"', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({
          exercisedBeforeNmo: false,
          exercisesBeforeNmo: null,
        }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe('"physicalActivity" != "no"', () => {
    const nonNoValues = PHYSICAL_ACTIVITY_FREQUENCIES.filter((v) => v !== 'no');

    it.each(nonNoValues)(
      'accepts "physicalActivityType" for "%s"',
      (activity) => {
        const result = dailyLifeSurveySchema.safeParse(
          makePayload({
            physicalActivity: activity,
            physicalActivityType: 'walking',
          }),
        );
        expect(result.success).toBe(true);
      },
    );

    it.each(nonNoValues)(
      'rejects null "physicalActivityType" for "%s"',
      (activity) => {
        const result = dailyLifeSurveySchema.safeParse(
          makePayload({
            physicalActivity: activity,
            physicalActivityType: null,
          }),
        );
        expect(result.success).toBe(false);

        if (!result.success) {
          const issue = result.error.issues.find(
            (i) => i.path[0] === 'physicalActivityType',
          );
          expect(issue).toBeDefined();
          expect(issue!.message).toContain('required');
        }
      },
    );
  });

  describe('"physicalActivity" = "no"', () => {
    it('rejects non-null "physicalActivityType"', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({
          physicalActivity: 'no',
          physicalActivityType: 'walking',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'physicalActivityType',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must be null');
      }
    });
  });

  describe('"exercisedBeforeNmo" = "true"', () => {
    it('rejects null "exercisesBeforeNmo"', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({
          exercisedBeforeNmo: true,
          exercisesBeforeNmo: null,
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'exercisesBeforeNmo',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('required');
      }
    });
  });

  describe('"exercisedBeforeNmo" = "false"', () => {
    it('rejects non-null "exercisesBeforeNmo"', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({
          exercisedBeforeNmo: false,
          exercisesBeforeNmo: 'walking_1_or_2',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'exercisesBeforeNmo',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must be null');
      }
    });
  });

  describe('"informationSources"', () => {
    it('rejects an empty array', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({ informationSources: [] }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'informationSources',
        );
        expect(issue).toBeDefined();
      }
    });
  });

  describe('cross-scenario', () => {
    it('returns error only for "physicalActivityType" when "exercisedBeforeNmo" group is valid', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({
          physicalActivity: 'two_week',
          physicalActivityType: null,
          exercisedBeforeNmo: false,
          exercisesBeforeNmo: null,
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('physicalActivityType');
        expect(paths).not.toContain('exercisesBeforeNmo');
      }
    });

    it('returns errors for both groups simultaneously', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({
          physicalActivity: 'only_physiotherapy',
          physicalActivityType: null,
          exercisedBeforeNmo: true,
          exercisesBeforeNmo: null,
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('physicalActivityType');
        expect(paths).toContain('exercisesBeforeNmo');
      }
    });
  });

  describe('required fields', () => {
    it('rejects when "familySupport" is missing', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({ familySupport: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "fatigue" is missing', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({ fatigue: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "physicalActivity" is missing', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({ physicalActivity: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "exercisedBeforeNmo" is missing', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({ exercisedBeforeNmo: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "informationSources" is missing', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({ informationSources: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "lifePerception" is missing', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({ lifePerception: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "dreams" is missing', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({ dreams: undefined }),
      );
      expect(result.success).toBe(false);
    });
  });
});
