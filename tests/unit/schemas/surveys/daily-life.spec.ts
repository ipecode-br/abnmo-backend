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
  additionalInfo: 'In consectetur incididunt nostrud.',
  ...overrides,
});

describe('dailyLifeSurveySchema', () => {
  describe('Happy path', () => {
    it('accepts when "physicalActivity" is "no" with null "physicalActivityType"', () => {
      const result = dailyLifeSurveySchema.safeParse(makePayload());
      expect(result.success).toBe(true);
    });

    it('accepts when "physicalActivity" is "one_week" with valid "physicalActivityType"', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({
          physicalActivity: 'one_week',
          physicalActivityType: 'walking',
        }),
      );
      expect(result.success).toBe(true);
    });

    it('accepts when "exercisedBeforeNmo" is "true" with valid "exercisesBeforeNmo"', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({
          exercisedBeforeNmo: true,
          exercisesBeforeNmo: 'walking_1_or_2',
        }),
      );
      expect(result.success).toBe(true);
    });

    it('accepts when "exercisedBeforeNmo" is "false" with null "exercisesBeforeNmo"', () => {
      const result = dailyLifeSurveySchema.safeParse(
        makePayload({
          exercisedBeforeNmo: false,
          exercisesBeforeNmo: null,
        }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe('When "physicalActivity" is NOT "no"', () => {
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

  describe('When "physicalActivity" is "no"', () => {
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

  describe('When "exercisedBeforeNmo" is "true"', () => {
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

  describe('When "exercisedBeforeNmo" is "false"', () => {
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

  describe('Reject empty arrays', () => {
    const fieldsCannotBeEmpty = ['informationSources'];

    it.each(fieldsCannotBeEmpty)(
      'rejects when "%s" is an empty array',
      (field) => {
        const result = dailyLifeSurveySchema.safeParse(
          makePayload({ [field]: [] }),
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
      'familySupport',
      'fatigue',
      'physicalActivity',
      'exercisedBeforeNmo',
      'informationSources',
      'lifePerception',
      'dreams',
      'additionalInfo',
    ];

    it.each(requiredFields)('rejects when "%s" is missing', (field) => {
      const result = dailyLifeSurveySchema.safeParse(
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
