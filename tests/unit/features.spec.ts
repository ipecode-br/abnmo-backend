import { USER_FEATURES } from '@/domain/enums/users';

const VALID_TARGETS = [
  'survey',
  'patient',
  'patient-requirement',
  'appointment',
  'referral',
  'user',
  'user-invite',
];
const VALID_CONDITIONS = ['others'];

describe('features', () => {
  it('must match "action:target" or "action:target:condition"', () => {
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

  it('third part must be a valid "condition" when present', () => {
    for (const feature of USER_FEATURES) {
      const parts = feature.split(':');
      if (parts.length === 3) {
        expect(VALID_CONDITIONS).toContain(parts[2]);
      }
    }
  });
});
