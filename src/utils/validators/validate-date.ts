import { CURRENT_YEAR } from '@/config';
import { DATE_REGEX } from '@/constants/regex';

interface ValidateDateInputOptions {
  startYear?: number;
  endYear?: number;
  separator?: '/' | '-';
}

/**
 * Validates a fully typed DD/MM/YYYY string.
 * Returns true only when all parts are in valid ranges.
 *
 * Rules:
 *  - Day   : 01 – 31
 *  - Month : 01 – 12
 *  - Year  : > options.startYear (1900) || < options.endYear (Current)
 */
export function validateDate(
  value: string,
  options: ValidateDateInputOptions = {},
): boolean {
  if (!DATE_REGEX.test(value)) return false;

  const startYear = options.startYear || 1900;
  const endYear = options.endYear || CURRENT_YEAR;
  const separator = options.separator || '/';

  const [day, month, year] = value.split(separator).map(Number);

  if (day < 1 || day > 31) return false;
  if (month < 1 || month > 12) return false;
  if (year < startYear) return false;
  if (year > endYear) return false;

  // Cross-check with a real Date so February / short months are caught too
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
