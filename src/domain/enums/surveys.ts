export const SURVEY_STATUSES = ['pending_signature', 'completed'] as const;
export type SurveyStatus = (typeof SURVEY_STATUSES)[number];

export const SURVEYS_ORDER_BY = ['status', 'date'] as const;
export type SurveysOrderBy = (typeof SURVEYS_ORDER_BY)[number];

// About

export const GENDERS = [
  'male_cis',
  'female_cis',
  'male_trans',
  'female_trans',
  'non_binary',
  'prefer_not_to_say',
  'other',
] as const;
export type Gender = (typeof GENDERS)[number];

export const RACES = [
  'yellow',
  'white',
  'indigenous',
  'mixed_race',
  'black',
  'prefer_not_to_say',
] as const;
export type Race = (typeof RACES)[number];

export const MARITAL_STATUSES = [
  'single',
  'stable_union',
  'married',
  'divorced',
  'widowed',
] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

// Family

export const CHILDREN_SCHOOL_SUPPORT_SITUATIONS = [
  'no_school_age_children',
  'lives_with_parent',
  'receives_alimony',
  'has_children_no_alimony',
  'other',
] as const;
export type ChildrenSchoolSupportSituation =
  (typeof CHILDREN_SCHOOL_SUPPORT_SITUATIONS)[number];

export const FAMILY_INCOMES = [
  'less_than_one',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten_or_more',
] as const;
export type FamilyIncome = (typeof FAMILY_INCOMES)[number];

export const HOUSING_SITUATIONS = [
  'rented',
  'borrowed',
  'owned',
  'family_or_third_party',
] as const;
export type HousingSituation = (typeof HOUSING_SITUATIONS)[number];

export const HOME_ACCESS_LEVELS = ['full', 'assisted', 'none'] as const;
export type HomeAccessLevel = (typeof HOME_ACCESS_LEVELS)[number];

export const TRANSPORT_MODES = [
  'ambulance',
  'carpool',
  'app_car',
  'own_car',
  'app_motorcycle',
  'own_motorcycle',
  'taxi',
  'public_transport',
] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];

export const KINSHIP_TYPES = [
  'grandparent',
  'spouse',
  'children',
  'sibling',
  'parent',
  'cousin',
  'nephew_niece',
  'uncle_aunt',
  'other',
] as const;
export type KinshipType = (typeof KINSHIP_TYPES)[number];

// Journey

export const EDUCATION_LEVELS = [
  'no_literacy',
  'elementary_incomplete',
  'elementary_complete',
  'high_school_incomplete',
  'high_school_complete',
  'technical',
  'higher_education_incomplete',
  'higher_education_complete',
  'postgraduate',
  'masters',
  'doctorate',
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const EMPLOYMENT_STATUSES = [
  'on_leave_sickness',
  'retired',
  'retired_disability',
  'bpc_loas',
  'unemployed',
  'student',
  'employed_formal',
  'self_employed',
] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const EMPLOYMENT_STATUSES_WITH_DETAILS_REQUIRED: EmploymentStatus[] = [
  'on_leave_sickness',
  'employed_formal',
  'self_employed',
];

export const STUDY_INTERRUPTION_SITUATIONS = [
  'did_not_interrupt',
  'interrupted_returned',
  'interrupted_not_returned',
] as const;
export type StudyInterruptionSituation =
  (typeof STUDY_INTERRUPTION_SITUATIONS)[number];

export const SALARY_RANGES = [
  'none',
  'less_than_one',
  'one',
  'between_one_and_two',
  'between_two_and_three',
  'between_four_and_five',
  'more_than_six',
] as const;
export type SalaryRange = (typeof SALARY_RANGES)[number];

export const SICKNESS_BENEFIT_STATUSES = [
  'receiving',
  'not_receiving',
  'unaware_of_right',
  'denied',
  'received_no_longer_needed',
  'received_converted_to_retirement',
  'not_entitled',
  'received_suspended',
] as const;
export type SicknessBenefitStatus = (typeof SICKNESS_BENEFIT_STATUSES)[number];

export const BPC_LOAS_STATUSES = [
  'receiving',
  'never_requested',
  'denied',
  'not_applicable',
] as const;
export type BpcLoasStatus = (typeof BPC_LOAS_STATUSES)[number];

export const DIAGNOSIS_TYPES = [
  'anti_aqp4_positive',
  'anti_aqp4_negative',
  'anti_mog_positive',
  'both_negative',
] as const;
export type DiagnosisType = (typeof DIAGNOSIS_TYPES)[number];

export const FIRST_CRISIS_SYMPTOMS = [
  'vomiting',
  'hiccups',
  'tingling_lower_limbs',
  'tingling_upper_limbs',
  'leg_weakness',
  'arm_weakness',
  'bladder_loss',
  'bowel_loss',
  'vision_loss_one_eye',
  'vision_loss_both_eyes',
  'numbness_lower_limbs',
  'numbness_upper_limbs',
  'numbness_other',
  'other',
] as const;
export type FirstCrisisSymptom = (typeof FIRST_CRISIS_SYMPTOMS)[number];

export const AFFECTED_AREAS = [
  'vision',
  'legs',
  'arms',
  'intestine',
  'bladder',
  'trunk',
  'area_postrema',
] as const;
export type AffectedArea = (typeof AFFECTED_AREAS)[number];

export const SPECIALTIES_BEFORE_DIAGNOSIS = [
  'general_practitioner',
  'neurologist',
  'gastroenterologist',
  'ophthalmologist',
  'infectologist',
  'rheumatologist',
  'orthopedist',
  'physiotherapist',
  'pediatrician',
  'nephrologist',
  'psychiatrist',
  'angiologist',
  'physiatrist',
  'otorhinolaryngologist',
  'urologist',
  'psychology',
] as const;
export type SpecialtyBeforeDiagnosis =
  (typeof SPECIALTIES_BEFORE_DIAGNOSIS)[number];

export const TIME_UNITS = ['days', 'weeks', 'years'] as const;
export type TimeUnits = (typeof TIME_UNITS)[number];

export const TREATMENT_LOCATIONS = [
  'lives_in_capital',
  'lives_in_interior',
  'goes_to_capital',
  'goes_to_other_interior',
] as const;
export type TreatmentLocation = (typeof TREATMENT_LOCATIONS)[number];

export const CRISIS_ACTIONS = [
  'reference_doctor',
  'reference_hospital',
  'upa',
  'psf',
  'hospital_emergency',
  'hospital_emergency_other_city',
  'no_assistance',
] as const;
export type CrisisAction = (typeof CRISIS_ACTIONS)[number];

// Follow-up

export const FOLLOW_UP_SPECIALTIES = [
  'neurologist',
  'physiotherapist',
  'physical_educator',
  'occupational_therapist',
  'nutritionist',
  'speech_therapist',
  'ophthalmologist',
  'psychologist',
  'psychiatrist',
  'alternative_therapist',
  'other',
] as const;
export type FollowUpSpecialty = (typeof FOLLOW_UP_SPECIALTIES)[number];

export const FOLLOW_UP_HOW = [
  'sus',
  'private',
  'health_insurance',
  'sus_and_insurance',
  'sus_and_private',
  'not_treating',
] as const;
export type FollowUpHow = (typeof FOLLOW_UP_HOW)[number];

export const LEGAL_ACTIONS = [
  'yes_obtained',
  'yes_denied',
  'no_sus',
  'no_insurance',
  'buys_medication',
] as const;
export type LegalAction = (typeof LEGAL_ACTIONS)[number];

export const DAILY_ACTIVITY_ASSISTANCES = [
  'all_activities',
  'some_activities',
  'no',
] as const;
export type DailyActivityAssistance =
  (typeof DAILY_ACTIVITY_ASSISTANCES)[number];

export const VISUAL_ASSISTIVE_TECHNOLOGIES = [
  'glasses',
  'computer_accessibility',
  'phone_accessibility',
  'magnifier',
] as const;
export type VisualAssistiveTechnology =
  (typeof VISUAL_ASSISTIVE_TECHNOLOGIES)[number];

export const WALKING_DISTANCES = [
  'less_than_10m',
  'between_10_and_500m',
  'more_than_500m',
] as const;
export type WalkingDistance = (typeof WALKING_DISTANCES)[number];

export const BLADDER_CONTROLS = [
  'yes',
  'yes_urgent',
  'no_leak',
  'no_catheter',
  'no_device',
  'no_diapers',
] as const;
export type BladderControl = (typeof BLADDER_CONTROLS)[number];

export const BOWEL_FUNCTIONS = [
  'daily',
  'every_2_3_days',
  'more_than_5_days',
  'stool_leakage',
] as const;
export type BowelFunction = (typeof BOWEL_FUNCTIONS)[number];

export const BLOOD_TYPES = [
  'A_positive',
  'A_negative',
  'B_positive',
  'B_negative',
  'AB_positive',
  'AB_negative',
  'O_positive',
  'O_negative',
] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

// Daily life

export const FAMILY_SUPPORTS = [
  'not_need',
  'always',
  'sometimes',
  'not_as_id_like',
  'no_family',
  'no',
] as const;
export type FamilySupportType = (typeof FAMILY_SUPPORTS)[number];

export const FATIGUE_LEVELS = ['always', 'in_heat', 'sometimes', 'no'] as const;
export type FatigueLevel = (typeof FATIGUE_LEVELS)[number];

export const PHYSICAL_ACTIVITY_FREQUENCIES = [
  'four_or_more_week',
  'three_week',
  'two_week',
  'one_week',
  'only_physiotherapy',
  'no',
] as const;
export type PhysicalActivityFrequency =
  (typeof PHYSICAL_ACTIVITY_FREQUENCIES)[number];

export const PHYSICAL_ACTIVITY_TYPES = [
  'walking',
  'running',
  'weight_training',
  'pilates',
  'yoga',
  'swimming',
  'water_aerobics',
  'cycling',
  'dancing',
  'soccer',
  'martial_arts',
  'functional',
  'other',
] as const;
export type PhysicalActivityType = (typeof PHYSICAL_ACTIVITY_TYPES)[number];

export const EXERCISES_BEFORE_NMO = [
  'walking_1_or_2',
  'walking_3_or_more',
  'running_1_or_2',
  'running_3_or_more',
  'weight_training',
  'swimming_hydro',
  'pilates_yoga',
  'dancing',
  'sports',
  'other',
] as const;
export type ExerciseBeforeNmo = (typeof EXERCISES_BEFORE_NMO)[number];

export const INFORMATION_SOURCES = [
  'with_my_doctor',
  'with_other_patients',
  'instagram',
  'facebook',
  'tiktok',
  'google_or_other_search_engines',
  'youtube',
  'do_not_seek_information',
  'others',
] as const;
export type InformationSource = (typeof INFORMATION_SOURCES)[number];
