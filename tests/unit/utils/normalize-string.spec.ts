import { normalizeString } from '@/utils/normalize-string';

describe('normalizeString()', () => {
  it('converts to lowercase', () => {
    expect(normalizeString('HelloWorld')).toBe('helloworld');
  });

  it('replaces accented characters with ASCII', () => {
    expect(normalizeString('coração')).toBe('coracao');
    expect(normalizeString('são josé')).toBe('sao_jose');
  });

  it('replaces spaces with underscores', () => {
    expect(normalizeString('hello world')).toBe('hello_world');
  });

  it('replaces non-alphanumeric characters with underscores', () => {
    expect(normalizeString('hello@world!')).toBe('hello_world');
  });

  it('collapses consecutive underscores', () => {
    expect(normalizeString('hello   world')).toBe('hello_world');
  });

  it('trims leading and trailing underscores', () => {
    expect(normalizeString(' - hello - ')).toBe('-_hello_-');
  });

  it('handles mixed input', () => {
    expect(normalizeString('  Olá, Mundo! -- Test  ')).toBe(
      'ola_mundo_--_test',
    );
  });
});
