export const AUTH_TOKENS = ['access_token', 'password_reset'] as const;
export type AuthTokenType = (typeof AUTH_TOKENS)[number];
