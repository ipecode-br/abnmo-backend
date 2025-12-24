export const AUTH_ACCOUNT_TYPES = ['user', 'patient'] as const;
export type AuthAccountType = (typeof AUTH_ACCOUNT_TYPES)[number];
