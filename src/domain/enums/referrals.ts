export const REFERRAL_STATUSES = [
  'scheduled',
  'canceled',
  'completed',
  'no_show',
] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

export const REFERRAL_CATEGORIES = [
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
export type ReferralCategory = (typeof REFERRAL_CATEGORIES)[number];

export const REFERRAL_ORDER_BY = [
  'name',
  'condition',
  'category',
  'date',
] as const;
export type ReferralOrderBy = (typeof REFERRAL_ORDER_BY)[number];
