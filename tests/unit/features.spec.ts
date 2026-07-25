import { USER_FEATURES } from '@/domain/enums/users';

const VALID_TARGETS = [
  'survey',
  'patient',
  'patient-requirement',
  'appointment',
  'referral',
  'user',
  'user-invite',
  'statistic',
  'webhook',
];
const VALID_SCOPES = ['others', 'patient', 'appointment', 'referral'];

describe('features', () => {
  it('must match "action:target" or "action:target:scope"', () => {
    for (const feature of USER_FEATURES) {
      const parts = feature.split(':');
      expect(parts.length).toBeGreaterThanOrEqual(2);
      expect(parts.length).toBeLessThanOrEqual(3);
    }
  });

  it('second part must be a valid "target"', () => {
    for (const feature of USER_FEATURES) {
      const [, target] = feature.split(':');
      expect(VALID_TARGETS).toContain(target);
    }
  });

  it('third part must be a valid "scope" when present', () => {
    for (const feature of USER_FEATURES) {
      const parts = feature.split(':');
      if (parts.length === 3) {
        expect(VALID_SCOPES).toContain(parts[2]);
      }
    }
  });
});
