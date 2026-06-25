import { CURRENT_YEAR } from '@/config';

interface ValidateDateInputOptions {
  startYear?: number;
  endYear?: number;
}

export function validateDate(
  date: Date,
  options: ValidateDateInputOptions = {},
): boolean {
  const startYear = options.startYear || 1900;
  const endYear = options.endYear || CURRENT_YEAR;

  const year = new Date(date).getFullYear();

  if (year < startYear) return false;
  if (year > endYear) return false;

  return true;
}
