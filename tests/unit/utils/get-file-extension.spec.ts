import { getFileExtension } from '@/utils/get-file-extension';

describe('getFileExtension()', () => {
  it('returns the extension from MIME type', () => {
    expect(getFileExtension('image/png')).toBe('png');
    expect(getFileExtension('image/jpeg')).toBe('jpeg');
    expect(getFileExtension('application/pdf')).toBe('pdf');
  });

  it('lowercases the extension', () => {
    expect(getFileExtension('image/PNG')).toBe('png');
    expect(getFileExtension('application/JSON')).toBe('json');
  });

  it('returns empty string for MIME without subtype', () => {
    expect(getFileExtension('image/')).toBe('');
  });

  it('returns the last part for multi-part MIME', () => {
    expect(getFileExtension('application/vnd.ms-excel')).toBe('vnd.ms-excel');
  });
});
