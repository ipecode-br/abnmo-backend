export const USER_ROLES = ['admin', 'manager', 'nurse', 'specialist'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['active', 'inactive'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const USERS_ORDER_BY = ['name', 'date', 'role', 'status'] as const;
export type UsersOrderBy = (typeof USERS_ORDER_BY)[number];

export const USER_INVITES_ORDER_BY = ['email', 'date'] as const;
export type UserInvitesOrderBy = (typeof USER_INVITES_ORDER_BY)[number];
