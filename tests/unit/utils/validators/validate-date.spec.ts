import { validateDate } from '@/utils/validators/validate-date';

describe('validateDate()', () => {
  it('returns "true" for a date within default range (1900 to current year)', () => {
    expect(validateDate(new Date('2000-01-01'))).toBe(true);
  });

  it('returns "true" for a date string within range', () => {
    expect(validateDate('2000-01-01')).toBe(true);
  });

  it('returns "false" for a date before default start year', () => {
    expect(validateDate(new Date('1899-12-31'))).toBe(false);
  });

  it('returns "false" for a date after default end year', () => {
    const futureYear = new Date().getFullYear() + 1;
    expect(validateDate(new Date(`${futureYear}-06-15`))).toBe(false);
  });

  it('uses custom "startYear"', () => {
    expect(validateDate(new Date('1950-01-01'), { startYear: 2000 })).toBe(
      false,
    );
    expect(validateDate(new Date('1950-01-01'), { startYear: 1900 })).toBe(
      true,
    );
  });

  it('uses custom "endYear"', () => {
    expect(validateDate(new Date('2050-01-01'), { endYear: 2000 })).toBe(false);
    expect(validateDate(new Date('2050-01-01'), { endYear: 2100 })).toBe(true);
    expect(validateDate(new Date('1950-01-01'), { endYear: 2000 })).toBe(true);
  });
});
