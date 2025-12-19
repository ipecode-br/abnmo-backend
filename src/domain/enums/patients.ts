export const PATIENT_GENDERS = [
  'male_cis',
  'female_cis',
  'male_trans',
  'female_trans',
  'non_binary',
  'prefer_not_to_say',
] as const;
export type PatientGender = (typeof PATIENT_GENDERS)[number];

export const PATIENT_STATUSES = ['active', 'inactive', 'pending'] as const;
export type PatientStatus = (typeof PATIENT_STATUSES)[number];

export const PATIENT_CONDITIONS = ['in_crisis', 'stable'] as const;
export type PatientCondition = (typeof PATIENT_CONDITIONS)[number];

export const PATIENT_NMO_DIAGNOSTICS = [
  'anti_aqp4_positive',
  'anti_mog_positive',
  'both_negative',
  'no_diagnosis',
] as const;
export type PatientNmoDiagnosis = (typeof PATIENT_NMO_DIAGNOSTICS)[number];

export const PATIENT_ORDER_BY = ['name', 'email', 'status', 'date'] as const;
export type PatientOrderBy = (typeof PATIENT_ORDER_BY)[number];
