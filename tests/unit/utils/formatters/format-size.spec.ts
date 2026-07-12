import { formatSize } from '@/utils/formatters/format-size';

describe('formatSize()', () => {
  it('returns bytes for values less than 1024', () => {
    expect(formatSize(0)).toBe('0 B');
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(1023)).toBe('1023 B');
  });

  it('returns KB for values between 1024 and 1048575', () => {
    expect(formatSize(1024)).toBe('1 KB');
    expect(formatSize(1536)).toBe('1.5 KB');
    expect(formatSize(1_048_575)).toBe('1024 KB');
  });

  it('returns MB for values 1048576 and above', () => {
    expect(formatSize(1_048_576)).toBe('1 MB');
    expect(formatSize(2_097_152)).toBe('2 MB');
  });

  it('rounds to one decimal place', () => {
    expect(formatSize(1280)).toBe('1.3 KB');
    expect(formatSize(1_536_000)).toBe('1.5 MB');
  });
});
