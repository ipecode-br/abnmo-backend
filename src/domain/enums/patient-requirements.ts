export const PATIENT_REQUIREMENT_TYPES = [
  'screening',
  'medical_report',
] as const;
export type PatientRequirementType = (typeof PATIENT_REQUIREMENT_TYPES)[number];

export const PATIENT_REQUIREMENT_STATUSES = [
  'pending',
  'under_review',
  'approved',
  'declined',
] as const;
export type PatientRequirementStatus =
  (typeof PATIENT_REQUIREMENT_STATUSES)[number];

export const PATIENT_REQUIREMENTS_ORDER_BY = [
  'name',
  'status',
  'type',
  'date',
  'approved_at',
  'submitted_at',
] as const;
export type PatientRequirementOrderBy =
  (typeof PATIENT_REQUIREMENTS_ORDER_BY)[number];
