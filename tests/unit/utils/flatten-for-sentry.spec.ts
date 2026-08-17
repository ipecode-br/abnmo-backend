import { flattenForSentry } from '@/utils/flatten-for-sentry';

describe('flattenForSentry()', () => {
  it('anonymizes "email" values', () => {
    const result = flattenForSentry({ email: 'user@example.com' });

    expect(result).toEqual({ email: 'use***@example.com' });
  });

  it('anonymizes "phone" values in E.164 format', () => {
    const result = flattenForSentry({ phone: '+5511999999999' });

    expect(result).toEqual({ phone: '+551199***99' });
  });

  it('anonymizes "phone" values in national format', () => {
    const result = flattenForSentry({ phone: '11999999999' });

    expect(result).toEqual({ phone: '(11) 999**-****' });
  });

  it('anonymizes "name" values', () => {
    const result = flattenForSentry({ name: 'Fulano de Tal' });

    expect(result).toEqual({ name: 'Ful***Tal' });
  });

  it('anonymizes "cpf" values', () => {
    const result = flattenForSentry({ cpf: '52998224725' });

    expect(result).toEqual({ cpf: '529***25' });
  });

  it('stringifies array values', () => {
    const result = flattenForSentry({ tags: ['a', 'b'] });

    expect(result).toEqual({ tags: '["a","b"]' });
  });

  it('passes unmapped keys through unchanged', () => {
    const result = flattenForSentry({ messageId: 'msg-1', count: 2 });

    expect(result).toEqual({ messageId: 'msg-1', count: 2 });
  });
});
