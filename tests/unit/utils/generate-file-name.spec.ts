import { generateFileName } from '@/utils/generate-file-name';

describe('generateFileName()', () => {
  it('generates filename with UUID and extension from MIME type', () => {
    const result = generateFileName({ mimeType: 'image/png' });

    expect(result).toMatch(/^_[0-9a-f-]+\.png$/);
  });

  it('includes prefix with underscore', () => {
    const result = generateFileName({
      mimeType: 'image/png',
      prefix: 'avatar',
    });

    expect(result).toMatch(/^avatar_[0-9a-f-]+\.png$/);
  });

  it('includes normalized name', () => {
    const result = generateFileName({
      mimeType: 'application/pdf',
      name: 'Meu Documento',
    });

    expect(result).toMatch(/^meu_documento_[0-9a-f-]+\.pdf$/);
  });

  it('includes prefix and name together', () => {
    const result = generateFileName({
      mimeType: 'image/jpeg',
      prefix: 'avatar',
      name: 'João Silva',
    });

    expect(result).toMatch(/^avatar_joao_silva_[0-9a-f-]+\.jpeg$/);
  });

  it('truncates long names to 40 characters', () => {
    const longName = 'a'.repeat(50);

    const result = generateFileName({
      mimeType: 'image/png',
      name: longName,
    });

    const namePart = result.split('_')[0];
    expect(namePart.length).toBeLessThanOrEqual(40);
  });

  it('removes special characters from name', () => {
    const result = generateFileName({
      mimeType: 'image/png',
      name: 'hello@world!',
    });

    expect(result).toMatch(/^hello_world_[0-9a-f-]+\.png$/);
  });
});
