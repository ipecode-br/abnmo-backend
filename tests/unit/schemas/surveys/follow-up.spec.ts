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
  describe('Happy path', () => {
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

  describe('When "hasVisualAlteration" is "true"', () => {
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

  describe('When "hasVisualAlteration" is "false"', () => {
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

  describe('When "hasMotorSequelae" is "true"', () => {
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

  describe('When "hasMotorSequelae" is "false"', () => {
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

  describe('When "hasOtherDisease" is "true"', () => {
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

  describe('When "hasOtherDisease" is "false"', () => {
    it('accepts null "otherDiseaseDescription"', () => {
      const result = followUpSurveySchema.safeParse(
        makePayload({ hasOtherDisease: false, otherDiseaseDescription: null }),
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

  describe('Reject empty arrays', () => {
    const fieldsCannotBeEmpty = ['followUpSpecialties'];

    it.each(fieldsCannotBeEmpty)(
      'rejects when "%s" is an empty array',
      (field) => {
        const result = followUpSurveySchema.safeParse(
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

  describe('Reject empty strings', () => {
    const fieldsCannotBeEmpty = ['otherSequelae', 'otherDiseaseDescription'];

    it.each(fieldsCannotBeEmpty)(
      'rejects when "%s" is an empty string',
      (field) => {
        const result = followUpSurveySchema.safeParse(
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
      'followUpSpecialties',
      'followUpHow',
      'hasHealthInsurance',
      'legalActionForMedication',
      'hasVisualAlteration',
      'usesWalkingAid',
      'hasMotorSequelae',
      'bladderControl',
      'bowelFunction',
      'psychologicalMedsBeforeNmo',
      'psychologicalMedsAfterNmo',
      'psychologicalDiagnosisAfterNmo',
      'hasOtherDisease',
    ];

    it.each(requiredFields)('rejects when "%s" is missing', (field) => {
      const result = followUpSurveySchema.safeParse(
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
