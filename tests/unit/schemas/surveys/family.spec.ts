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
  describe('happy path', () => {
    it('accepts "numberOfChildren" = 0 with null children fields', () => {
      const result = familySurveySchema.safeParse(makePayload());
      expect(result.success).toBe(true);
    });

    it('accepts "numberOfChildren" = 2 with matching "childrenAges" and "childrenSchoolSupportSituation"', () => {
      const result = familySurveySchema.safeParse(
        makePayload({
          numberOfChildren: 2,
          childrenAges: [5, 8],
          childrenSchoolSupportSituation: 'lives_with_parent',
        }),
      );
      expect(result.success).toBe(true);
    });

    it('accepts "numberOfChildren" = 1 with a single "childrenAges" entry', () => {
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

  describe('numberOfChildren = "0"', () => {
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

    it('returns both errors when "childrenAges" and "childrenSchoolSupportSituation" are non-null simultaneously', () => {
      const result = familySurveySchema.safeParse(
        makePayload({
          numberOfChildren: 0,
          childrenAges: [5],
          childrenSchoolSupportSituation: 'lives_with_parent',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('childrenAges');
        expect(paths).toContain('childrenSchoolSupportSituation');
      }
    });

    it('rejects empty array "childrenAges"', () => {
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

  describe('numberOfChildren > "0"', () => {
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

    it('rejects invalid "childrenAges" and null "childrenSchoolSupportSituation" simultaneously', () => {
      const result = familySurveySchema.safeParse(
        makePayload({
          numberOfChildren: 3,
          childrenAges: [1],
          childrenSchoolSupportSituation: null,
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('childrenAges');
        expect(paths).toContain('childrenSchoolSupportSituation');
      }
    });
  });

  describe('"transportModes"', () => {
    it('rejects an empty array', () => {
      const result = familySurveySchema.safeParse(
        makePayload({ transportModes: [] }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'transportModes',
        );
        expect(issue).toBeDefined();
      }
    });
  });

  describe('"householdSize"', () => {
    it('rejects a value less than 1', () => {
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
  });

  describe('required fields', () => {
    it('rejects when "numberOfChildren" is missing', () => {
      const result = familySurveySchema.safeParse(
        makePayload({ numberOfChildren: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "familyIncome" is missing', () => {
      const result = familySurveySchema.safeParse(
        makePayload({ familyIncome: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "housingSituation" is missing', () => {
      const result = familySurveySchema.safeParse(
        makePayload({ housingSituation: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "householdSize" is missing', () => {
      const result = familySurveySchema.safeParse(
        makePayload({ householdSize: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "houseRooms" is missing', () => {
      const result = familySurveySchema.safeParse(
        makePayload({ houseRooms: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "houseBathrooms" is missing', () => {
      const result = familySurveySchema.safeParse(
        makePayload({ houseBathrooms: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "homeAccessLevel" is missing', () => {
      const result = familySurveySchema.safeParse(
        makePayload({ homeAccessLevel: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "transportModes" is missing', () => {
      const result = familySurveySchema.safeParse(
        makePayload({ transportModes: undefined }),
      );
      expect(result.success).toBe(false);
    });
  });
});
