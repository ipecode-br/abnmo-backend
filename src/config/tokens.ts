import { TokenType } from '@/domain/enums/tokens';

export const TOKEN_EXPIRY_TIME: Record<
  TokenType,
  { value: number; time: 'h' | 'd' }
> = {
  password_reset: { value: 2, time: 'h' },
  invite_user: { value: 8, time: 'h' },
};

export function getTokenMaxAge(tokenType: TokenType): number {
  const ONE_HOUR = 1000 * 60 * 60;

  const expiryTime = TOKEN_EXPIRY_TIME[tokenType];

  if (expiryTime.time === 'd') {
    return ONE_HOUR * 24 * expiryTime.value;
  }

  return ONE_HOUR * expiryTime.value;
}
