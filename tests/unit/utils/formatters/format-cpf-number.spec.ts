import { formatCpfNumber } from '@/utils/formatters/format-cpf-number';

describe('formatCpfNumber()', () => {
  it('removes non-numeric characters and limits to 11 digits', () => {
    expect(formatCpfNumber('123abc45678901xyz')).toBe('12345678901');
  });

  it('slices to 11 digits', () => {
    expect(formatCpfNumber('12345678901234')).toBe('12345678901');
  });

  it('returns empty string for non-numeric input', () => {
    expect(formatCpfNumber('abc')).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(formatCpfNumber('')).toBe('');
  });

  it('strips formatting from already formatted CPF', () => {
    expect(formatCpfNumber('123.456.789-01')).toBe('12345678901');
  });
});
