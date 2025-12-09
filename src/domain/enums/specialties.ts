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
