import { faker } from '@faker-js/faker';

import { Survey } from '@/domain/entities/survey';
import { User } from '@/domain/entities/user';
import { BRAZIL_STATES } from '@/domain/enums/shared';
import {
  AFFECTED_AREAS,
  BLADDER_CONTROLS,
  BLOOD_TYPES,
  BOWEL_FUNCTIONS,
  BPC_LOAS_STATUSES,
  CHILDREN_SCHOOL_SUPPORT_SITUATIONS,
  CRISIS_ACTIONS,
  DAILY_ACTIVITY_ASSISTANCES,
  DIAGNOSIS_TYPES,
  EDUCATION_LEVELS,
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_STATUSES_WITH_DETAILS_REQUIRED,
  EXERCISES_BEFORE_NMO,
  FAMILY_INCOMES,
  FAMILY_SUPPORTS,
  FATIGUE_LEVELS,
  FIRST_CRISIS_SYMPTOMS,
  FOLLOW_UP_HOW,
  FOLLOW_UP_SPECIALTIES,
  GENDERS,
  HOME_ACCESS_LEVELS,
  HOUSING_SITUATIONS,
  INFORMATION_SOURCES,
  LEGAL_ACTIONS,
  MARITAL_STATUSES,
  PHYSICAL_ACTIVITY_FREQUENCIES,
  PHYSICAL_ACTIVITY_TYPES,
  RACES,
  SALARY_RANGES,
  SICKNESS_BENEFIT_STATUSES,
  SPECIALTIES_BEFORE_DIAGNOSIS,
  STUDY_INTERRUPTION_SITUATIONS,
  SURVEY_STATUSES,
  TIME_UNITS,
  TRANSPORT_MODES,
  TREATMENT_LOCATIONS,
  VISUAL_ASSISTIVE_TECHNOLOGIES,
  WALKING_DISTANCES,
} from '@/domain/enums/surveys';

import { baseEntityFactory, dateFactory, nameFactory } from './shared.factory';

export function surveyFactory(
  patient: User,
  overrides: Partial<Survey> = {},
): Survey {
  const selectedState = faker.helpers.arrayElement(BRAZIL_STATES);
  const hasLivedElsewhere = faker.datatype.boolean();
  const numberOfChildren = faker.number.int({ min: 0, max: 5 });
  const employmentStatus = faker.helpers.arrayElement(EMPLOYMENT_STATUSES);
  const changedProfession = EMPLOYMENT_STATUSES_WITH_DETAILS_REQUIRED.includes(
    employmentStatus,
  )
    ? faker.datatype.boolean()
    : null;
  const diagnosisHospitalName = faker.datatype.boolean()
    ? faker.company.name()
    : null;

  return {
    ...baseEntityFactory(),
    createdAt: dateFactory(),
    user: patient,
    status: faker.helpers.arrayElement(SURVEY_STATUSES),
    signatureId: null,
    dateOfBirth: faker.date
      .birthdate({ min: 18, max: 80, mode: 'age' })
      .toISOString()
      .split('T')[0],
    gender: faker.helpers.arrayElement(GENDERS),
    race: faker.helpers.arrayElement(RACES),
    maritalStatus: faker.helpers.arrayElement(MARITAL_STATUSES),
    addressCep: faker.string.numeric(8),
    addressState: selectedState,
    addressCity: faker.location.city(),
    addressStreet: faker.location.street(),
    addressNumber: faker.datatype.boolean()
      ? faker.number.int({ min: 1, max: 9999 }).toString()
      : null,
    addressNeighborhood: faker.datatype.boolean()
      ? faker.location.county()
      : null,
    hasLivedElsewhere,
    livedElsewhereDescription: hasLivedElsewhere
      ? faker.lorem.sentence()
      : null,
    numberOfChildren,
    childrenAges:
      numberOfChildren > 0
        ? Array.from({ length: numberOfChildren }, () =>
            faker.number.int({ min: 1, max: 18 }),
          )
        : null,
    childrenSchoolSupportSituation:
      numberOfChildren > 0
        ? faker.helpers.arrayElement(CHILDREN_SCHOOL_SUPPORT_SITUATIONS)
        : null,
    familyIncome: faker.helpers.arrayElement(FAMILY_INCOMES),
    housingSituation: faker.helpers.arrayElement(HOUSING_SITUATIONS),
    householdSize: faker.number.int({ min: 1, max: 6 }),
    houseRooms: faker.number.int({ min: 1, max: 8 }),
    houseBathrooms: faker.number.int({ min: 1, max: 4 }),
    homeAccessLevel: faker.helpers.arrayElement(HOME_ACCESS_LEVELS),
    transportModes: faker.helpers.arrayElements(TRANSPORT_MODES, {
      min: 1,
      max: 4,
    }),
    educationLevel: faker.helpers.arrayElement(EDUCATION_LEVELS),
    employmentStatus,
    studyInterruption:
      employmentStatus === 'student'
        ? faker.helpers.arrayElement(STUDY_INTERRUPTION_SITUATIONS)
        : null,
    profession: EMPLOYMENT_STATUSES_WITH_DETAILS_REQUIRED.includes(
      employmentStatus,
    )
      ? faker.person.jobType()
      : null,
    jobTitle: faker.datatype.boolean() ? faker.person.jobTitle() : null,
    salaryRange: faker.helpers.arrayElement(SALARY_RANGES),
    dismissedAfterDiagnosis: faker.datatype.boolean() || null,
    changedProfession,
    changedProfessionTo: changedProfession ? faker.person.jobTitle() : null,
    currentJobIsPcd: faker.datatype.boolean() || null,
    receivesSicknessBenefit: faker.helpers.arrayElement(
      SICKNESS_BENEFIT_STATUSES,
    ),
    receivesBpcLoas: faker.helpers.arrayElement(BPC_LOAS_STATUSES),
    diagnosis: faker.helpers.arrayElement(DIAGNOSIS_TYPES),
    firstCrisisSymptoms: faker.helpers.arrayElements(FIRST_CRISIS_SYMPTOMS, {
      min: 1,
      max: 4,
    }),
    affectedAreas: faker.helpers.arrayElements(AFFECTED_AREAS, {
      min: 1,
      max: 4,
    }),
    diagnosingDoctorName: faker.datatype.boolean() ? nameFactory() : null,
    diagnosisHospitalName,
    diagnosisHospitalCep:
      diagnosisHospitalName && faker.datatype.boolean()
        ? faker.string.numeric(8)
        : null,
    diagnosisHospitalState: faker.datatype.boolean() ? selectedState : null,
    diagnosisHospitalCity: faker.datatype.boolean()
      ? faker.location.city()
      : null,
    diagnosisHospitalStreet: faker.datatype.boolean()
      ? faker.location.streetAddress()
      : null,
    diagnosisDate: faker.date.between({
      from: new Date().setFullYear(new Date().getFullYear() - 4),
      to: new Date(),
    }),
    diagnosisDocument: faker.datatype.boolean()
      ? faker.string.alphanumeric(20)
      : null,
    currentNeurologist: faker.datatype.boolean() ? nameFactory() : null,
    currentTreatmentHospital: faker.datatype.boolean()
      ? faker.company.name()
      : null,
    currentTreatmentHospitalCep: faker.datatype.boolean()
      ? faker.string.numeric(8)
      : null,
    specialistsBeforeDiagnosis: faker.helpers.arrayElements(
      SPECIALTIES_BEFORE_DIAGNOSIS,
      { min: 1, max: 4 },
    ),
    timeToDiagnosis: faker.number.int({ min: 1, max: 30 }),
    timeToDiagnosisUnit: faker.helpers.arrayElement(TIME_UNITS),
    suspectedMultipleSclerosis: faker.datatype.boolean() || null,
    otherSuspectedDiseases: faker.datatype.boolean()
      ? faker.lorem.words(3)
      : null,
    crisesBeforeDiagnosis: faker.datatype.boolean()
      ? faker.number.int({ min: 0, max: 10 })
      : null,
    crisesSinceDiagnosis: faker.datatype.boolean()
      ? faker.number.int({ min: 0, max: 10 })
      : null,
    treatmentInHomeCity: faker.helpers.arrayElement(TREATMENT_LOCATIONS),
    hasNeurologistsInCity: faker.datatype.boolean() || null,
    crisisAction: faker.helpers.arrayElement(CRISIS_ACTIONS),
    followUpSpecialties: faker.helpers.arrayElements(FOLLOW_UP_SPECIALTIES, {
      min: 1,
      max: 4,
    }),
    otherFollowUpProfessionals: faker.helpers.arrayElements(
      ['Personal trainer', 'Psicólogo', 'Nutricionista'],
      faker.number.int({ min: 0, max: 2 }),
    ),
    followUpHow: faker.helpers.arrayElement(FOLLOW_UP_HOW),
    hasHealthInsurance: faker.datatype.boolean(),
    nmoMedications: faker.helpers.arrayElements(
      [
        'Azatioprina',
        'Corticóide',
        'Inebilizumabe',
        'Metotrexato',
        'Micofenolato',
        'Rituximabe',
      ],
      faker.number.int({ min: 0, max: 4 }),
    ),
    crisesAfterMedication: faker.datatype.boolean()
      ? faker.number.int({ min: 0, max: 5 })
      : null,
    legalActionForMedication: faker.helpers.arrayElement(LEGAL_ACTIONS),
    generalMedications: faker.helpers.arrayElements(
      ['Duloxetina', 'Fluoxetina', 'Gabapentina', 'Levotiroxina', 'Losartana'],
      faker.number.int({ min: 0, max: 4 }),
    ),
    hasVisualAlteration: faker.datatype.boolean(),
    usesVisualCane: faker.datatype.boolean() || null,
    visualImpairmentAssistance: faker.datatype.boolean()
      ? faker.helpers.arrayElement(DAILY_ACTIVITY_ASSISTANCES)
      : null,
    visualAssistiveTechnologies: faker.helpers.arrayElements(
      VISUAL_ASSISTIVE_TECHNOLOGIES,
    ),
    usesWheelchair: faker.datatype.boolean(),
    hasMotorSequelae: faker.datatype.boolean(),
    motorImpairmentAssistance: faker.datatype.boolean()
      ? faker.helpers.arrayElement(DAILY_ACTIVITY_ASSISTANCES)
      : null,
    walkingDistance: faker.datatype.boolean()
      ? faker.helpers.arrayElement(WALKING_DISTANCES)
      : null,
    usesWalkingAid: faker.datatype.boolean(),
    bladderControl: faker.helpers.arrayElement(BLADDER_CONTROLS),
    bowelFunction: faker.helpers.arrayElement(BOWEL_FUNCTIONS),
    otherSequelae: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    psychologicalMedsBeforeNmo: faker.datatype.boolean(),
    psychologicalMedsAfterNmo: faker.datatype.boolean(),
    psychologicalDiagnosisAfterNmo: faker.datatype.boolean(),
    bloodType: faker.datatype.boolean()
      ? faker.helpers.arrayElement(BLOOD_TYPES)
      : null,
    hasOtherDisease: faker.datatype.boolean(),
    otherDiseaseDescription: faker.datatype.boolean()
      ? faker.lorem.sentence()
      : null,
    familySupport: faker.helpers.arrayElement(FAMILY_SUPPORTS),
    fatigue: faker.helpers.arrayElement(FATIGUE_LEVELS),
    physicalActivity: faker.helpers.arrayElement(PHYSICAL_ACTIVITY_FREQUENCIES),
    physicalActivityType: faker.datatype.boolean()
      ? faker.helpers.arrayElement(PHYSICAL_ACTIVITY_TYPES)
      : null,
    exercisedBeforeNmo: faker.datatype.boolean(),
    exercisesBeforeNmo: faker.helpers.arrayElement(EXERCISES_BEFORE_NMO),
    informationSources: faker.helpers.arrayElements(INFORMATION_SOURCES, {
      min: 1,
      max: 4,
    }),
    lifePerception: faker.lorem.paragraph(),
    dreams: faker.lorem.paragraph(),
    additionalInfo: faker.lorem.paragraph(),
    ...overrides,
  };
}
