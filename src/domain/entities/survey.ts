import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import {
  BRAZILIAN_STATES,
  type BrazilianState,
} from '@/constants/brazilian-states';

import { BRAZIL_STATES, BrazilState } from '../enums/shared';
import type {
  AffectedArea,
  FirstCrisisSymptom,
  FollowUpSpecialty,
  InformationSource,
  SpecialtyBeforeDiagnosis,
  TransportMode,
  VisualAssistiveTechnology,
} from '../enums/survey';
import {
  BLADDER_CONTROLS,
  type BladderControl,
  BLOOD_TYPES,
  type BloodType,
  BOWEL_FUNCTIONS,
  type BowelFunction,
  BPC_LOAS_STATUSES,
  type BpcLoasStatus,
  CHILDREN_SCHOOL_SUPPORT_SITUATIONS,
  type ChildrenSchoolSupportSituation,
  CRISIS_ACTIONS,
  type CrisisAction,
  DAILY_ACTIVITY_ASSISTANCES,
  type DailyActivityAssistance,
  DIAGNOSIS_TYPES,
  type DiagnosisType,
  EDUCATION_LEVELS,
  type EducationLevel,
  EMPLOYMENT_STATUSES,
  type EmploymentStatus,
  type ExerciseBeforeNmo,
  EXERCISES_BEFORE_NMO,
  FAMILY_INCOMES,
  FAMILY_SUPPORTS,
  type FamilyIncome,
  type FamilySupportType,
  FATIGUE_LEVELS,
  type FatigueLevel,
  FOLLOW_UP_HOW,
  type FollowUpHow,
  type Gender,
  GENDERS,
  HOME_ACCESS_LEVELS,
  type HomeAccessLevel,
  HOUSING_SITUATIONS,
  type HousingSituation,
  LEGAL_ACTIONS,
  type LegalAction,
  MARITAL_STATUSES,
  type MaritalStatus,
  PHYSICAL_ACTIVITY_FREQUENCIES,
  PHYSICAL_ACTIVITY_TYPES,
  type PhysicalActivityFrequency,
  type PhysicalActivityType,
  type Race,
  RACES,
  SALARY_RANGES,
  type SalaryRange,
  SICKNESS_BENEFIT_STATUSES,
  type SicknessBenefitStatus,
  STUDY_INTERRUPTION_SITUATIONS,
  type StudyInterruptionSituation,
  type SubmissionStatus,
  SURVEY_STATUSES,
  TIME_UNITS,
  type TimeUnits,
  TREATMENT_LOCATIONS,
  type TreatmentLocation,
  WALKING_DISTANCES,
  type WalkingDistance,
} from '../enums/survey';
import type { SurveySchema } from '../schemas/survey';
import { BaseEntity } from './base';
import { User } from './user';

@Entity('surveys')
export class Survey extends BaseEntity implements SurveySchema {
  @Column('uuid')
  userId: string;

  @Column({ type: 'enum', enum: SURVEY_STATUSES, default: 'pending_signature' })
  status: SubmissionStatus;

  // About

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column({ type: 'enum', enum: GENDERS })
  gender: Gender;

  @Column({ type: 'enum', enum: RACES, nullable: true })
  race: Race | null;

  @Column({ type: 'enum', enum: MARITAL_STATUSES })
  maritalStatus: MaritalStatus;

  @Column({ type: 'varchar', length: 8 })
  addressCep: string;

  @Column({ type: 'enum', enum: BRAZIL_STATES })
  addressState: BrazilState;

  @Column({ type: 'varchar', length: 64 })
  addressCity: string;

  @Column({ type: 'varchar', length: 255 })
  addressStreet: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  addressNumber: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  addressNeighborhood: string | null;

  @Column('boolean')
  hasLivedElsewhere: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  livedElsewhereDescription: string | null;

  // Family

  @Column({ type: 'int', default: 0 })
  numberOfChildren: number;

  @Column({ type: 'json', nullable: true })
  childrenAges: number[] | null;

  @Column({
    type: 'enum',
    enum: CHILDREN_SCHOOL_SUPPORT_SITUATIONS,
    nullable: true,
  })
  childrenSchoolSupportSituation: ChildrenSchoolSupportSituation | null;

  @Column({ type: 'enum', enum: FAMILY_INCOMES })
  familyIncome: FamilyIncome;

  @Column({ type: 'enum', enum: HOUSING_SITUATIONS })
  housingSituation: HousingSituation;

  @Column({ type: 'int', default: 1 })
  householdSize: number;

  @Column({ type: 'int', default: 0 })
  houseRooms: number;

  @Column({ type: 'int', default: 0 })
  houseBathrooms: number;

  @Column({ type: 'enum', enum: HOME_ACCESS_LEVELS })
  homeAccessLevel: HomeAccessLevel;

  @Column({ type: 'json' })
  transportModes: TransportMode[];

  // Journey

  @Column({ type: 'enum', enum: EDUCATION_LEVELS })
  educationLevel: EducationLevel;

  @Column({ type: 'enum', enum: EMPLOYMENT_STATUSES })
  employmentStatus: EmploymentStatus;

  @Column({ type: 'enum', enum: STUDY_INTERRUPTION_SITUATIONS, nullable: true })
  studyInterruption: StudyInterruptionSituation | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  profession: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  jobTitle: string | null;

  @Column({ type: 'enum', enum: SALARY_RANGES })
  salaryRange: SalaryRange;

  @Column({ type: 'boolean', nullable: true })
  dismissedAfterDiagnosis: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  changedProfession: boolean | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  changedProfessionTo: string | null;

  @Column({ type: 'boolean', nullable: true })
  currentJobIsPcd: boolean | null;

  @Column({ type: 'enum', enum: SICKNESS_BENEFIT_STATUSES })
  receivesSicknessBenefit: SicknessBenefitStatus;

  @Column({ type: 'enum', enum: BPC_LOAS_STATUSES })
  receivesBpcLoas: BpcLoasStatus;

  // Diagnosis

  @Column({ type: 'enum', enum: DIAGNOSIS_TYPES })
  diagnosis: DiagnosisType;

  @Column({ type: 'json' })
  firstCrisisSymptoms: FirstCrisisSymptom[];

  @Column({ type: 'json' })
  affectedAreas: AffectedArea[];

  @Column({ type: 'varchar', length: 128, nullable: true })
  diagnosingDoctorName: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  diagnosisHospitalName: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  diagnosisHospitalCep: string | null;

  @Column({ type: 'enum', enum: BRAZILIAN_STATES, nullable: true })
  diagnosisHospitalState: BrazilianState | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  diagnosisHospitalCity: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  diagnosisHospitalStreet: string | null;

  @Column({ type: 'date' })
  diagnosisDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  diagnosisDocument: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  currentNeurologist: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  currentTreatmentHospital: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  currentTreatmentHospitalCep: string | null;

  @Column({ type: 'json' })
  specialistsBeforeDiagnosis: SpecialtyBeforeDiagnosis[];

  @Column({ type: 'int' })
  timeToDiagnosis: number;

  @Column({ type: 'enum', enum: TIME_UNITS })
  timeToDiagnosisUnit: TimeUnits;

  @Column({ type: 'boolean', nullable: true })
  suspectedMultipleSclerosis: boolean | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  otherSuspectedDiseases: string | null;

  @Column({ type: 'boolean', nullable: true })
  crisesBeforeDiagnosis: number | null;

  @Column({ type: 'boolean', nullable: true })
  crisesSinceDiagnosis: number | null;

  @Column({ type: 'enum', enum: TREATMENT_LOCATIONS })
  treatmentInHomeCity: TreatmentLocation;

  @Column({ type: 'boolean', nullable: true })
  hasNeurologistsInCity: boolean | null;

  @Column({ type: 'enum', enum: CRISIS_ACTIONS })
  crisisAction: CrisisAction;

  // Follow-up

  @Column({ type: 'json' })
  followUpSpecialties: FollowUpSpecialty[];

  @Column({ type: 'json' })
  otherFollowUpProfessionals: string[] = [];

  @Column({ type: 'enum', enum: FOLLOW_UP_HOW })
  followUpHow: FollowUpHow;

  @Column('boolean')
  hasHealthInsurance: boolean;

  @Column({ type: 'json' })
  nmoMedications: string[] = [];

  @Column({ type: 'boolean', nullable: true })
  crisesAfterMedication: number | null;

  @Column({ type: 'enum', enum: LEGAL_ACTIONS })
  legalActionForMedication: LegalAction;

  @Column({ type: 'json' })
  generalMedications: string[] = [];

  @Column('boolean')
  hasVisualAlteration: boolean;

  @Column({ type: 'boolean', nullable: true })
  usesVisualCane: boolean | null;

  @Column({ type: 'enum', enum: DAILY_ACTIVITY_ASSISTANCES, nullable: true })
  visualImpairmentAssistance: DailyActivityAssistance | null;

  @Column({ type: 'json' })
  visualAssistiveTechnologies: VisualAssistiveTechnology[] = [];

  @Column('boolean')
  usesWheelchair: boolean;

  @Column('boolean')
  hasMotorSequelae: boolean;

  @Column({ type: 'enum', enum: DAILY_ACTIVITY_ASSISTANCES, nullable: true })
  motorImpairmentAssistance: DailyActivityAssistance | null;

  @Column({ type: 'enum', enum: WALKING_DISTANCES, nullable: true })
  walkingDistance: WalkingDistance | null;

  @Column('boolean')
  usesWalkingAid: boolean;

  @Column({ type: 'enum', enum: BLADDER_CONTROLS })
  bladderControl: BladderControl;

  @Column({ type: 'enum', enum: BOWEL_FUNCTIONS })
  bowelFunction: BowelFunction;

  @Column({ type: 'varchar', length: 300, nullable: true })
  otherSequelae: string | null;

  @Column('boolean')
  psychologicalMedsBeforeNmo: boolean;

  @Column('boolean')
  psychologicalMedsAfterNmo: boolean;

  @Column('boolean')
  psychologicalDiagnosisAfterNmo: boolean;

  @Column({ type: 'enum', enum: BLOOD_TYPES, nullable: true })
  bloodType: BloodType | null;

  @Column('boolean')
  hasOtherDisease: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  otherDiseaseDescription: string | null;

  // Daily life

  @Column({ type: 'enum', enum: FAMILY_SUPPORTS })
  familySupport: FamilySupportType;

  @Column({ type: 'enum', enum: FATIGUE_LEVELS })
  fatigue: FatigueLevel;

  @Column({ type: 'enum', enum: PHYSICAL_ACTIVITY_FREQUENCIES })
  physicalActivity: PhysicalActivityFrequency;

  @Column({ type: 'enum', enum: PHYSICAL_ACTIVITY_TYPES, nullable: true })
  physicalActivityType: PhysicalActivityType | null;

  @Column('boolean')
  exercisedBeforeNmo: boolean;

  @Column({ type: 'enum', enum: EXERCISES_BEFORE_NMO, nullable: true })
  exercisesBeforeNmo: ExerciseBeforeNmo | null;

  @Column({ type: 'json' })
  informationSources: InformationSource[];

  @Column({ type: 'varchar', length: 800 })
  lifePerception: string;

  @Column({ type: 'varchar', length: 800 })
  dreams: string;

  @Column({ type: 'varchar', length: 800 })
  additionalInfo: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;
}
