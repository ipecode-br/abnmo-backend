import {
  AboutYouSurveySchema,
  aboutYouSurveySchema,
} from '@/domain/schemas/surveys/requests/about-you';

// Valid base payload
const makePayload = (overrides?: Partial<AboutYouSurveySchema>) => ({
  dateOfBirth: '1990-05-15',
  gender: 'female_cis',
  race: 'white',
  maritalStatus: 'single',
  addressCep: '12345678',
  addressState: 'BA',
  addressCity: 'Salvador',
  addressStreet: 'Av Paulista',
  addressNumber: '1024B',
  addressNeighborhood: 'Bela Vista',
  hasLivedElsewhere: false,
  livedElsewhereDescription: null,
  cpf: '25890738011',
  susId: null,
  ...overrides,
});

describe('aboutYouSurveySchema', () => {
  describe('Happy path', () => {
    it('accepts a valid payload with "hasLivedElsewhere=false"', () => {
      const result = aboutYouSurveySchema.safeParse(makePayload());
      expect(result.success).toBe(true);
    });

    it('accepts "hasLivedElsewhere=true" with long description', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({
          hasLivedElsewhere: true,
          livedElsewhereDescription: 'More than three characters',
        }),
      );
      expect(result.success).toBe(true);
    });

    it('accepts null "susId"', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ susId: null }),
      );
      expect(result.success).toBe(true);
    });

    it('accepts null "addressNumber"', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ addressNumber: null }),
      );
      expect(result.success).toBe(true);
    });

    it('accepts null "addressNeighborhood"', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ addressNeighborhood: null }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe('When "hasLivedElsewhere" is "true"', () => {
    it('rejects null "livedElsewhereDescription"', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({
          hasLivedElsewhere: true,
          livedElsewhereDescription: null,
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'livedElsewhereDescription',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must have more than 3 characters');
      }
    });

    it('rejects "livedElsewhereDescription" with an empty string', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ hasLivedElsewhere: true, livedElsewhereDescription: '' }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'livedElsewhereDescription',
        );
        expect(issue).toBeDefined();
      }
    });

    it('rejects "livedElsewhereDescription" with length exactly 3', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({
          hasLivedElsewhere: true,
          livedElsewhereDescription: 'abc',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'livedElsewhereDescription',
        );
        expect(issue).toBeDefined();
      }
    });

    it('accepts "livedElsewhereDescription" with length exactly 4', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({
          hasLivedElsewhere: true,
          livedElsewhereDescription: 'abcd',
        }),
      );
      expect(result.success).toBe(true);
    });
  });

  describe('When "hasLivedElsewhere" is "false"', () => {
    it('accepts null "livedElsewhereDescription"', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({
          hasLivedElsewhere: false,
          livedElsewhereDescription: null,
        }),
      );
      expect(result.success).toBe(true);
    });

    it('rejects non-null "livedElsewhereDescription"', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({
          hasLivedElsewhere: false,
          livedElsewhereDescription: 'some text',
        }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'livedElsewhereDescription',
        );
        expect(issue).toBeDefined();
        expect(issue!.message).toContain('must be null');
      }
    });
  });

  describe('Invalid types or values', () => {
    it('rejects "dateOfBirth" with an invalid ISO date', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ dateOfBirth: '1940-14-01' }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects "dateOfBirth" in the far future', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ dateOfBirth: '2200-01-01' }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'dateOfBirth',
        );
        expect(issue).toBeDefined();
      }
    });

    it('rejects "dateOfBirth" before DATE_OF_BIRTH_START_YEAR (far past)', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ dateOfBirth: '1890-01-01' }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'dateOfBirth',
        );
        expect(issue).toBeDefined();
      }
    });

    it('rejects "cpf" with wrong length', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ cpf: '123' }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects "cpf" with non-numeric characters', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ cpf: '5299822472A' }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects "susId" with non-numeric characters', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ susId: '12A' }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects "addressCep" with wrong length', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ addressCep: '12345' }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'addressCep',
        );
        expect(issue).toBeDefined();
      }
    });

    it('rejects "addressCep" with non-numeric characters', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ addressCep: '1234567A' }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'addressCep',
        );
        expect(issue).toBeDefined();
      }
    });

    it('rejects an invalid Brazilian "addressState"', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ addressState: 'AB' as 'SP' }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'addressState',
        );
        expect(issue).toBeDefined();
      }
    });
  });

  describe('Reject empty strings', () => {
    const fieldsCannotBeEmpty = [
      'susId',
      'addressCep',
      'addressCity',
      'addressStreet',
      'addressNumber',
      'addressNeighborhood',
      'livedElsewhereDescription',
    ];

    it.each(fieldsCannotBeEmpty)(
      'rejects when "%s" is an empty string',
      (field) => {
        const result = aboutYouSurveySchema.safeParse(
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
      'cpf',
      'dateOfBirth',
      'gender',
      'race',
      'maritalStatus',
      'addressCep',
      'addressState',
      'addressCity',
      'addressStreet',
      'addressNumber',
      'addressNeighborhood',
      'hasLivedElsewhere',
    ];

    it.each(requiredFields)('rejects when "%s" is missing', (field) => {
      const result = aboutYouSurveySchema.safeParse(
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
