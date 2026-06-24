export const FEATURES = [
  // Users
  'read:user',
  'read:user:others',
  'update:user',
  'update:user:others',
  'activate:user',
  'deactivate:user',
  'create:user_invite',
  'read:user_invite',
  'delete:user_invite',
  // Survey
  'read:survey',
  'approve:survey',
  'update:survey',
  'delete:survey',
] as const;
export type Feature = (typeof FEATURES)[number];

export const SPECIALTY_CATEGORIES = [
  'medical_care',
  'legal',
  'nursing',
  'psychology',
  'nutrition',
  'physical_training',
  'social_work',
  'psychiatry',
  'neurology',
  'ophthalmology',
] as const;
export type SpecialtyCategory = (typeof SPECIALTY_CATEGORIES)[number];
