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
  describe('happy path', () => {
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
  });

  describe('dateOfBirth', () => {
    it('rejects an invalid ISO date', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ dateOfBirth: '1940-14-01' }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects a date in the far future', () => {
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

    it('rejects a date before DATE_OF_BIRTH_START_YEAR (far past)', () => {
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
  });

  describe('hasLivedElsewhere = "true"', () => {
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

  describe('hasLivedElsewhere = "false"', () => {
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

  describe('cpf', () => {
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

    it('rejects "cpf" with an empty string', () => {
      const result = aboutYouSurveySchema.safeParse(makePayload({ cpf: '' }));
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'cpf');
        expect(issue).toBeDefined();
      }
    });
  });

  describe('susId', () => {
    it('accepts a valid numeric "susId"', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ susId: '123456789012345' }),
      );
      expect(result.success).toBe(true);
    });

    it('accepts null as a valid "susId"', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ susId: null }),
      );
      expect(result.success).toBe(true);
    });

    it('rejects "susId" with non-numeric characters', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ susId: '12A' }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects "susId" with an empty string', () => {
      const result = aboutYouSurveySchema.safeParse(makePayload({ susId: '' }));
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'susId');
        expect(issue).toBeDefined();
      }
    });
  });

  describe('addressCep', () => {
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

    it('rejects "addressCep" with an empty string', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ addressCep: '' }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'addressCep',
        );
        expect(issue).toBeDefined();
      }
    });
  });

  describe('addressState', () => {
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

    it('rejects "addressState" with an empty string', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ addressState: '' as 'SP' }),
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

  describe('addressCity', () => {
    it('rejects "addressCity" with an empty string', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ addressCity: '' as 'SP' }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'addressCity',
        );
        expect(issue).toBeDefined();
      }
    });
  });

  describe('addressStreet', () => {
    it('rejects "addressStreet" with an empty string', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ addressStreet: '' }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'addressStreet',
        );
        expect(issue).toBeDefined();
      }
    });
  });

  describe('addressNumber', () => {
    it('accepts null as a valid "addressNumber"', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ addressNumber: null }),
      );
      expect(result.success).toBe(true);
    });

    it('rejects "addressNumber" with an empty string', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ addressNumber: '' }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'addressNumber',
        );
        expect(issue).toBeDefined();
      }
    });
  });

  describe('addressNeighborhood', () => {
    it('accepts null as a valid "addressNeighborhood"', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ addressNeighborhood: null }),
      );
      expect(result.success).toBe(true);
    });

    it('rejects "addressNeighborhood" with an empty string', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ addressNeighborhood: '' }),
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path[0] === 'addressNeighborhood',
        );
        expect(issue).toBeDefined();
      }
    });
  });

  describe('required fields', () => {
    it('rejects when "dateOfBirth" is missing', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ dateOfBirth: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "gender" is missing', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ gender: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "race" is missing', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ race: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "maritalStatus" is missing', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ maritalStatus: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "cpf" is missing', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ cpf: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "addressCep" is missing', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ addressCep: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "addressState" is missing', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ addressState: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "addressCity" is missing', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ addressCity: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "addressStreet" is missing', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ addressStreet: undefined }),
      );
      expect(result.success).toBe(false);
    });

    it('rejects when "hasLivedElsewhere" is missing', () => {
      const result = aboutYouSurveySchema.safeParse(
        makePayload({ hasLivedElsewhere: undefined }),
      );
      expect(result.success).toBe(false);
    });
  });
});
