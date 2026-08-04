import {
  FamilySurveySchema,
  familySurveySchema,
} from '@/domain/schemas/surveys/requests/family';

// Valid base payload
const makePayload = (overrides?: Partial<FamilySurveySchema>) => ({
  numberOfChildren: 0,
  childrenAges: null,
  childrenSchoolSupportSituation: null,
  familyIncome: 'less_than_one',
  housingSituation: 'rented',
  householdSize: 2,
  houseRooms: 3,
  houseBathrooms: 1,
  homeAccessLevel: 'full',
  transportModes: ['app_car'],
  ...overrides,
});

describe('familySurveySchema', () => {
  describe('Happy path', () => {
    it('accepts "numberOfChildren" with 0 and null children fields', () => {
      const result = familySurveySchema.safeParse(makePayload());
      expect(result.success).toBe(true);
    });

    it('accepts "numberOfChildren" with 2 and matching "childrenAges" and "childrenSchoolSupportSituation"', () => {
      const result = familySurveySchema.safeParse(
        makePayload({
          numberOfChildren: 2,
          childrenAges: [5, 8],
          childrenSchoolSupportSituation: 'lives_with_parent',
        }),
      );
      expect(result.success).toBe(true);
    });

    it('accepts "numberOfChildren" with 1 with a single "childrenAges" entry', () => {
      const result = familySurveySchema.safeParse(
        makePayload({
          numberOfChildren: 1,
          childrenAges: [3],
          childrenSchoolSupportSituation: 'receives_alimony',
        }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe('When "numberOfChildren" is 0', () => {
    it('rejects non-null "childrenAges"', () => {
      const result = familySurveySchema.safeParse(
        makePayload({ numberOfChildren: 0, childrenAges: [1] }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'childrenAges',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must be null');
      }
    });

    it('rejects non-null "childrenSchoolSupportSituation"', () => {
      const result = familySurveySchema.safeParse(
        makePayload({
          numberOfChildren: 0,
          childrenSchoolSupportSituation: 'lives_with_parent',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'childrenSchoolSupportSituation',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must be null');
      }
    });

    it('rejects "childrenAges" with an empty array ', () => {
      const result = familySurveySchema.safeParse(
        makePayload({ numberOfChildren: 0, childrenAges: [] }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'childrenAges',
        );
        expect(issue).toBeDefined();
      }
    });
  });

  describe('When "numberOfChildren" is greater than 0', () => {
    it('rejects when "childrenAges" length is less than "numberOfChildren"', () => {
      const result = familySurveySchema.safeParse(
        makePayload({
          numberOfChildren: 3,
          childrenAges: [2, 4],
          childrenSchoolSupportSituation: 'has_children_no_alimony',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'childrenAges',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('count must match');
      }
    });

    it('rejects when "childrenAges" length is greater than "numberOfChildren"', () => {
      const result = familySurveySchema.safeParse(
        makePayload({
          numberOfChildren: 2,
          childrenAges: [1, 2, 3],
          childrenSchoolSupportSituation: 'no_school_age_children',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'childrenAges',
        );
        expect(issue).toBeDefined();
      }
    });

    it('rejects null "childrenAges"', () => {
      const result = familySurveySchema.safeParse(
        makePayload({
          numberOfChildren: 2,
          childrenAges: null,
          childrenSchoolSupportSituation: 'lives_with_parent',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'childrenAges',
        );
        expect(issue).toBeDefined();
      }
    });

    it('rejects null "childrenSchoolSupportSituation"', () => {
      const result = familySurveySchema.safeParse(
        makePayload({
          numberOfChildren: 2,
          childrenAges: [7, 10],
          childrenSchoolSupportSituation: null,
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'childrenSchoolSupportSituation',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('required');
      }
    });
  });

  describe('Invalid types or values', () => {
    it('rejects "numberOfChildren" with a value less than 0', () => {
      const result = familySurveySchema.safeParse(
        makePayload({ numberOfChildren: -2 }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'numberOfChildren',
        );
        expect(issue).toBeDefined();
      }
    });

    it('rejects "childrenAges" with a value less than 0', () => {
      const result = familySurveySchema.safeParse(
        makePayload({ numberOfChildren: 1, childrenAges: [-1] }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'childrenAges',
        );
        expect(issue).toBeDefined();
      }
    });

    it('rejects "householdSize" with a value less than 1', () => {
      const result = familySurveySchema.safeParse(
        makePayload({ householdSize: 0 }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'householdSize',
        );
        expect(issue).toBeDefined();
      }
    });

    it('rejects "houseRooms" with a value less than 1', () => {
      const result = familySurveySchema.safeParse(
        makePayload({ houseRooms: 0 }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'houseRooms',
        );
        expect(issue).toBeDefined();
      }
    });

    it('rejects "houseBathrooms" with a value less than 0', () => {
      const result = familySurveySchema.safeParse(
        makePayload({ houseBathrooms: -1 }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'houseBathrooms',
        );
        expect(issue).toBeDefined();
      }
    });
  });

  describe('Reject empty arrays', () => {
    const fieldsCannotBeEmpty = ['transportModes'];

    it.each(fieldsCannotBeEmpty)(
      'rejects when "%s" is an empty array',
      (field) => {
        const result = familySurveySchema.safeParse(
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
      'numberOfChildren',
      'familyIncome',
      'housingSituation',
      'householdSize',
      'houseRooms',
      'houseBathrooms',
      'homeAccessLevel',
      'transportModes',
    ];

    it.each(requiredFields)('rejects when "%s" is missing', (field) => {
      const result = familySurveySchema.safeParse(
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
