export const PATIENT_CONDITIONS = ['in_crisis', 'stable'] as const;
export type PatientCondition = (typeof PATIENT_CONDITIONS)[number];

export const PATIENTS_ORDER_BY = ['name', 'email', 'status', 'date'] as const;
export type PatientsOrderBy = (typeof PATIENTS_ORDER_BY)[number];
