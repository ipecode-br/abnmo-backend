export const PATIENTS_STATISTIC_FIELDS = ['gender', 'city', 'state'] as const;
export type PatientsStatisticField = (typeof PATIENTS_STATISTIC_FIELDS)[number];
