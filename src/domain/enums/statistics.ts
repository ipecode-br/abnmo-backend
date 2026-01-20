import type { PatientGender } from './patients';

export const PATIENT_STATISTICS = ['gender', 'total'] as const;
export type PatientStatisticsResult = {
  gender: PatientGender;
  total: number;
};

export const PATIENTS_STATISTIC_FIELDS = ['gender', 'city', 'state'] as const;
export type PatientsStatisticField = (typeof PATIENTS_STATISTIC_FIELDS)[number];
