export const USER_ROLES = ['admin', 'member', 'specialist', 'patient'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['active', 'inactive', 'pending'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const USERS_ORDER_BY = ['name', 'date', 'role', 'status'] as const;
export type UsersOrderBy = (typeof USERS_ORDER_BY)[number];

export const USER_INVITES_ORDER_BY = ['email', 'date'] as const;
export type UserInvitesOrderBy = (typeof USER_INVITES_ORDER_BY)[number];

export const USER_FEATURES = [
  // Survey
  'read:survey',
  'read:survey:others',
  'update:survey',
  'update:survey:others',
  'cancel:survey',
  'cancel:survey:others',
  'review:survey',
  // Patients
  'read:patient',
  'read:patient:others',
  'update:patient',
  'update:patient:others',
  'activate:patient',
  'deactivate:patient',
  // Patients requirements
  'create:patient-requirement',
  'read:patient-requirement',
  'read:patient-requirement:others',
  'update:patient-requirement',
  'update:patient-requirement:others',
  'review:patient-requirement',
  // Appointments
  'create:appointment',
  'read:appointment',
  'read:appointment:others',
  'update:appointment',
  'update:appointment:others',
  'cancel:appointment',
  'cancel:appointment:others',
  // Referrals
  'create:referral',
  'read:referral',
  'read:referral:others',
  'update:referral',
  'update:referral:others',
  'cancel:referral',
  'cancel:referral:others',
  // Users
  'read:user',
  'read:user:others',
  'update:user',
  'update:user:others',
  'activate:user',
  'deactivate:user',
  // User invites
  'create:user-invite',
  'read:user-invite',
  'delete:user-invite',
  // Statistics
  'read:statistic',
  'read:statistic:patient',
  'read:statistic:appointment',
  'read:statistic:referral',
] as const;
export type UserFeature = (typeof USER_FEATURES)[number];

export const BASE_FEATURES: UserFeature[] = ['read:user', 'update:user'];

export const DEFAULT_MEMBER_FEATURES: UserFeature[] = [
  'read:user',
  'update:user',
  'read:patient',
  'read:patient:others',
];

export const DEFAULT_SPECIALIST_FEATURES: UserFeature[] = [
  'read:user',
  'update:user',
  'create:appointment',
  'read:appointment',
  'update:appointment',
  'cancel:appointment',
  'read:referral',
  'update:referral',
  'cancel:referral',
];

export const DEFAULT_PATIENT_FEATURES: UserFeature[] = [
  'read:patient',
  'update:patient',
  'read:survey',
  'read:appointment',
  'update:appointment',
  'cancel:appointment',
  'read:referral',
  'update:referral',
  'cancel:referral',
];
