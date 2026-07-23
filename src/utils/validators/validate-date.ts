import { CURRENT_YEAR } from '@/config';

interface ValidateDateInputOptions {
  startYear?: number;
  endYear?: number;
}

export function validateDate(
  date: Date | string,
  options: ValidateDateInputOptions = {},
): boolean {
  const normalizedDate = typeof date === 'string' ? new Date(date) : date;

  const startYear = options.startYear || 1900;
  const endYear = options.endYear || CURRENT_YEAR;

  const year = normalizedDate.getFullYear();

  if (year < startYear) return false;
  if (year > endYear) return false;

  return true;
}
