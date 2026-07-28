import {
  FollowUpSurveySchema,
  followUpSurveySchema,
} from '@/domain/schemas/surveys/requests/follow-up';

// Valid base payload
const makePayload = (overrides?: Partial<FollowUpSurveySchema>) => ({
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
  ...overrides,
});

describe('followUpSurveySchema', () => {
  describe('happy path', () => {
    it('accepts all trigger fields "false" with null dependent fields', () => {
      const result = followUpSurveySchema.safeParse(makePayload());
      expect(result.success).toBe(true);
    });

    it('accepts all trigger fields "true" with valid dependent fields', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasVisualAlteration: true,
          usesVisualCane: true,
          visualImpairmentAssistance: 'some_activities',
          hasMotorSequelae: true,
          motorImpairmentAssistance: 'all_activities',
          walkingDistance: 'less_than_10m',
          hasOtherDisease: true,
          otherDiseaseDescription: 'Diabetes',
        }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe('"hasVisualAlteration" = "true"', () => {
    it('accepts "usesVisualCane" = "false" (non-null) with valid "visualImpairmentAssistance"', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasVisualAlteration: true,
          usesVisualCane: false,
          visualImpairmentAssistance: 'no',
        }),
      );
      expect(result.success).toBe(true);
    });

    it('rejects null "usesVisualCane"', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasVisualAlteration: true,
          usesVisualCane: null,
          visualImpairmentAssistance: 'no',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'usesVisualCane',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('required');
      }
    });

    it('rejects null "visualImpairmentAssistance"', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasVisualAlteration: true,
          usesVisualCane: true,
          visualImpairmentAssistance: null,
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'visualImpairmentAssistance',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('required');
      }
    });
  });

  describe('"hasVisualAlteration" = "false"', () => {
    it('accepts null "usesVisualCane" and null "visualImpairmentAssistance"', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasVisualAlteration: false,
          usesVisualCane: null,
          visualImpairmentAssistance: null,
        }),
      );
      expect(result.success).toBe(true);
    });

    it('rejects "usesVisualCane" = "true"', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasVisualAlteration: false,
          usesVisualCane: true,
          visualImpairmentAssistance: null,
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'usesVisualCane',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must be null');
      }
    });

    it('rejects "usesVisualCane" = "false" ("false" !== null)', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasVisualAlteration: false,
          usesVisualCane: false,
          visualImpairmentAssistance: null,
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'usesVisualCane',
        );
        expect(issue).toBeDefined();
      }
    });

    it('rejects non-null "visualImpairmentAssistance"', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasVisualAlteration: false,
          usesVisualCane: null,
          visualImpairmentAssistance: 'all_activities',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'visualImpairmentAssistance',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must be null');
      }
    });
  });

  describe('"hasMotorSequelae" = "true"', () => {
    it('rejects null "motorImpairmentAssistance"', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasMotorSequelae: true,
          motorImpairmentAssistance: null,
          walkingDistance: 'less_than_10m',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'motorImpairmentAssistance',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('required');
      }
    });

    it('rejects null "walkingDistance"', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasMotorSequelae: true,
          motorImpairmentAssistance: 'some_activities',
          walkingDistance: null,
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'walkingDistance',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('required');
      }
    });
  });

  describe('"hasMotorSequelae" = "false"', () => {
    it('accepts both null dependent fields', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasMotorSequelae: false,
          motorImpairmentAssistance: null,
          walkingDistance: null,
        }),
      );
      expect(result.success).toBe(true);
    });

    it('rejects non-null "motorImpairmentAssistance"', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasMotorSequelae: false,
          motorImpairmentAssistance: 'no',
          walkingDistance: null,
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'motorImpairmentAssistance',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must be null');
      }
    });

    it('rejects non-null "walkingDistance"', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasMotorSequelae: false,
          motorImpairmentAssistance: null,
          walkingDistance: 'more_than_500m',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'walkingDistance',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must be null');
      }
    });
  });

  describe('"hasOtherDisease" = "true"', () => {
    it('accepts valid "otherDiseaseDescription"', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasOtherDisease: true,
          otherDiseaseDescription: 'Diabetes tipo 2',
        }),
      );
      expect(result.success).toBe(true);
    });

    it('rejects null "otherDiseaseDescription"', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasOtherDisease: true,
          otherDiseaseDescription: null,
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'otherDiseaseDescription',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('required');
      }
    });

    it('rejects empty string "otherDiseaseDescription"', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasOtherDisease: true,
          otherDiseaseDescription: '',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'otherDiseaseDescription',
        );
        expect(issue).toBeDefined();
      }
    });
  });

  describe('"hasOtherDisease" = "false"', () => {
    it('accepts null "otherDiseaseDescription"', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasOtherDisease: false,
          otherDiseaseDescription: null,
        }),
      );
      expect(result.success).toBe(true);
    });

    it('rejects non-null "otherDiseaseDescription"', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasOtherDisease: false,
          otherDiseaseDescription: 'Some disease',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'otherDiseaseDescription',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must be null');
      }
    });
  });

  describe('"followUpSpecialties"', () => {
    it('rejects an empty array', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({ followUpSpecialties: [] }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'followUpSpecialties',
        );
        expect(issue).toBeDefined();
      }
    });
  });

  describe('cross-scenario', () => {
    it('returns errors from multiple groups simultaneously', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({
          hasVisualAlteration: true,
          usesVisualCane: null,
          visualImpairmentAssistance: null,
          hasMotorSequelae: false,
          motorImpairmentAssistance: 'some_activities',
          walkingDistance: 'less_than_10m',
          hasOtherDisease: true,
          otherDiseaseDescription: null,
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('usesVisualCane');
        expect(paths).toContain('visualImpairmentAssistance');
        expect(paths).toContain('motorImpairmentAssistance');
        expect(paths).toContain('walkingDistance');
        expect(paths).toContain('otherDiseaseDescription');
      }
    });
  });

  describe('required fields', () => {
    it('rejects when "followUpSpecialties" is missing', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({ followUpSpecialties: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "followUpHow" is missing', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({ followUpHow: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "hasHealthInsurance" is missing', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({ hasHealthInsurance: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "legalActionForMedication" is missing', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({ legalActionForMedication: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "usesWheelchair" is missing', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({ usesWheelchair: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "usesWalkingAid" is missing', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({ usesWalkingAid: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "bladderControl" is missing', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({ bladderControl: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "bowelFunction" is missing', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({ bowelFunction: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "psychologicalMedsBeforeNmo" is missing', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({ psychologicalMedsBeforeNmo: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "psychologicalMedsAfterNmo" is missing', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({ psychologicalMedsAfterNmo: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "psychologicalDiagnosisAfterNmo" is missing', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({ psychologicalDiagnosisAfterNmo: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "hasOtherDisease" is missing', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({ hasOtherDisease: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "hasVisualAlteration" is missing', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({ hasVisualAlteration: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "hasMotorSequelae" is missing', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({ hasMotorSequelae: undefined }),
      );
      expect(result.success).toBe(false);
    });
  });
});
