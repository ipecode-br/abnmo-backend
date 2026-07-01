export const SESSION_SHORT_MAX_AGE = 1000 * 60 * 60 * 8; // 8 hours
export const SESSION_LONG_MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days

export const CURRENT_YEAR = new Date().getFullYear();

export const MAX_PATIENT_AGE = 120;
export const DATE_OF_BIRTH_START_YEAR = CURRENT_YEAR - MAX_PATIENT_AGE;
