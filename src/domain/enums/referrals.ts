export const REFERRAL_STATUSES = [
  'scheduled',
  'canceled',
  'completed',
  'no_show',
] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

export const REFERRAL_ORDER_BY = [
  'date',
  'patient',
  'status',
  'category',
  'condition',
  'professional',
] as const;
export type ReferralOrderBy = (typeof REFERRAL_ORDER_BY)[number];
