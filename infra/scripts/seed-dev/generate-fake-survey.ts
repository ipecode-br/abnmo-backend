import * as fs from 'node:fs';
import * as path from 'node:path';

import { faker } from '@faker-js/faker';
import dataSource from 'infra/database/data.source';
import type { DeepPartial } from 'typeorm';

import { Survey } from '@/domain/entities/survey';
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

import { generateFakeDate, generateFakeName } from './generate-fakes';

const citiesByState: Record<string, string[]> = {};
const statesWithCities = ['AL', 'BA', 'CE', 'PA'] as const;

for (const state of statesWithCities) {
  const filePath = path.join(__dirname, 'utils', 'cities', `${state}.json`);
  const data = fs.readFileSync(filePath, 'utf-8');
  citiesByState[state] = JSON.parse(data) as string[];
}

export function generateFakeSurvey(data: DeepPartial<Survey>): Survey {
  const repository = dataSource.getRepository(Survey);

  const today = new Date();

  const selectedState = faker.helpers.arrayElement(statesWithCities);

  function getRandomCity(): string {
    const cities = citiesByState[selectedState] || [];
    return faker.helpers.arrayElement(cities);
  }

  const numberOfChildren = faker.number.int({ min: 0, max: 5 });

  const baseData: DeepPartial<Survey> = {
    status: faker.helpers.arrayElement(SURVEY_STATUSES),
    createdAt: generateFakeDate(),
    // About
    dateOfBirth: faker.date
      .birthdate({ min: 18, max: 80, mode: 'age' })
      .toISOString()
      .split('T')[0],
    gender: faker.helpers.arrayElement(GENDERS),
    race: faker.helpers.arrayElement(RACES),
    maritalStatus: faker.helpers.arrayElement(MARITAL_STATUSES),
    addressCep: faker.string.numeric(8),
    addressState: selectedState,
    addressCity: getRandomCity(),
    addressStreet: faker.location.streetAddress(),
    addressNumber: faker.datatype.boolean()
      ? faker.number.int({ min: 1, max: 9999 }).toString()
      : null,
    addressNeighborhood: faker.datatype.boolean()
      ? faker.location.county()
      : null,
    hasLivedElsewhere: faker.datatype.boolean(),
    livedElsewhereDescription: faker.datatype.boolean()
      ? faker.lorem.sentence()
      : null,
    // Family
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
    transportModes: faker.helpers.arrayElements(TRANSPORT_MODES),
    // Journey
    educationLevel: faker.helpers.arrayElement(EDUCATION_LEVELS),
    employmentStatus: faker.helpers.arrayElement(EMPLOYMENT_STATUSES),
    studyInterruption: faker.helpers.arrayElement(
      STUDY_INTERRUPTION_SITUATIONS,
    ),
    profession: faker.datatype.boolean() ? faker.person.jobType() : null,
    jobTitle: faker.datatype.boolean() ? faker.person.jobTitle() : null,
    salaryRange: faker.helpers.arrayElement(SALARY_RANGES),
    dismissedAfterDiagnosis: faker.datatype.boolean() || null,
    changedProfession: faker.datatype.boolean() || null,
    changedProfessionTo: faker.datatype.boolean()
      ? faker.person.jobTitle()
      : null,
    currentJobIsPcd: faker.datatype.boolean() || null,
    receivesSicknessBenefit: faker.helpers.arrayElement(
      SICKNESS_BENEFIT_STATUSES,
    ),
    receivesBpcLoas: faker.helpers.arrayElement(BPC_LOAS_STATUSES),
    // Diagnosis
    diagnosis: faker.helpers.arrayElement(DIAGNOSIS_TYPES),
    firstCrisisSymptoms: faker.helpers.arrayElements(FIRST_CRISIS_SYMPTOMS),
    affectedAreas: faker.helpers.arrayElements(AFFECTED_AREAS),
    diagnosingDoctorName: faker.datatype.boolean() ? generateFakeName() : null,
    diagnosisHospitalName: faker.datatype.boolean()
      ? faker.company.name()
      : null,
    diagnosisHospitalCep: faker.datatype.boolean()
      ? faker.string.numeric(8)
      : null,
    diagnosisHospitalState: faker.datatype.boolean() ? selectedState : null,
    diagnosisHospitalCity: faker.datatype.boolean() ? getRandomCity() : null,
    diagnosisHospitalStreet: faker.datatype.boolean()
      ? faker.location.streetAddress()
      : null,
    diagnosisDate: faker.date.between({
      from: today.setFullYear(today.getFullYear() - 4),
      to: today,
    }),
    diagnosisDocument: faker.datatype.boolean()
      ? faker.string.alphanumeric(20)
      : null,
    currentNeurologist: faker.datatype.boolean() ? generateFakeName() : null,
    currentTreatmentHospital: faker.datatype.boolean()
      ? faker.company.name()
      : null,
    currentTreatmentHospitalCep: faker.datatype.boolean()
      ? faker.string.numeric(8)
      : null,
    specialistsBeforeDiagnosis: faker.helpers.arrayElements(
      SPECIALTIES_BEFORE_DIAGNOSIS,
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
    // Follow-up
    followUpSpecialties: faker.helpers.arrayElements(FOLLOW_UP_SPECIALTIES),
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
    // Daily life
    familySupport: faker.helpers.arrayElement(FAMILY_SUPPORTS),
    fatigue: faker.helpers.arrayElement(FATIGUE_LEVELS),
    physicalActivity: faker.helpers.arrayElement(PHYSICAL_ACTIVITY_FREQUENCIES),
    physicalActivityType: faker.datatype.boolean()
      ? faker.helpers.arrayElement(PHYSICAL_ACTIVITY_TYPES)
      : null,
    exercisedBeforeNmo: faker.datatype.boolean(),
    exercisesBeforeNmo: faker.helpers.arrayElement(EXERCISES_BEFORE_NMO),
    informationSources: faker.helpers.arrayElements(INFORMATION_SOURCES),
    lifePerception: faker.lorem.paragraph(),
    dreams: faker.lorem.paragraph(),
    additionalInfo: faker.lorem.paragraph(),
  };

  return repository.create({ ...baseData, ...data });
}
