import { USER_ROLES } from './users';

export const ALLOWED_ROLES = ['all', ...USER_ROLES] as const;
export type AllowedRole = (typeof ALLOWED_ROLES)[number];
