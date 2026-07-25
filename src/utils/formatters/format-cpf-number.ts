import { NON_NUMBER_REGEX } from '@/constants/regex';

/**
 * Formats a CPF number into the standard Brazilian pattern: `000.000.000-00`.
 *
 * All non-numeric characters are removed before formatting.
 * The value is limited to 11 digits.
 *
 * @param input - The raw CPF string (may contain non-numeric characters).
 *
 * @returns The formatted CPF string.
 *
 * @example
 * formatCpfNumber('12345678901')
 * // '123.456.789-01'
 *
 * @example
 * formatCpfNumber('123.456.789-01')
 * // '123.456.789-01'
 *
 * @example
 * formatCpfNumber('123abc45678901xyz')
 * // '123.456.789-01'
 */
export function formatCpfNumber(input: string) {
  const sanitizedInput = input.replace(NON_NUMBER_REGEX, '').slice(0, 11);

  return sanitizedInput.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    '$1.$2.$3-$4',
  );
}
