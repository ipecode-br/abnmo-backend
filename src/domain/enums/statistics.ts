export const PATIENT_FIELDS = ['gender', 'state'] as const;
export type PatientField = (typeof PATIENT_FIELDS)[number];

export const PATIENT_WITH_APPOINTMENT_FIELDS = ['state'] as const;
export type PatientWithAppointmentsField =
  (typeof PATIENT_WITH_APPOINTMENT_FIELDS)[number];

export const PATIENT_WITH_REFERRAL_FIELDS = ['state'] as const;
export type PatientWithReferralsField =
  (typeof PATIENT_WITH_REFERRAL_FIELDS)[number];
