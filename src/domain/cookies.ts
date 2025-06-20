import type { AuthToken } from './entities/tokens';

type Cookie = AuthToken;
type Cookies = Record<Cookie, string>;

export const COOKIES_MAPPER: Cookies = {
  access_token: 'access_token',
  password_reset: 'password_reset',
};
