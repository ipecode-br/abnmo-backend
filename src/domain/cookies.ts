import type { AuthTokenType } from './schemas/token';

type Cookie = AuthTokenType;
type Cookies = Record<Cookie, string>;

export const COOKIES_MAPPER: Cookies = {
  access_token: 'access_token',
  password_reset: 'password_reset',
};
