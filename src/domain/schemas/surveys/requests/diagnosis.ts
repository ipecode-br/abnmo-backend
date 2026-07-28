import z from 'zod';

import { surveySchema } from '..';

export const diagnosisSurveySchema = surveySchema
  .pick({
    diagnosis: true,
    firstCrisisSymptoms: true,
    affectedAreas: true,
    diagnosingDoctorName: true,
    diagnosisHospitalName: true,
    diagnosisHospitalCep: true,
    diagnosisHospitalState: true,
    diagnosisHospitalCity: true,
    diagnosisHospitalStreet: true,
    diagnosisDate: true,
    diagnosisDocument: true,
    currentNeurologist: true,
    currentTreatmentHospital: true,
    currentTreatmentHospitalCep: true,
    specialistsBeforeDiagnosis: true,
    timeToDiagnosis: true,
    timeToDiagnosisUnit: true,
    suspectedMultipleSclerosis: true,
    otherSuspectedDiseases: true,
    crisesBeforeDiagnosis: true,
    crisesSinceDiagnosis: true,
    treatmentInHomeCity: true,
    hasNeurologistsInCity: true,
    crisisAction: true,
  })
  .superRefine((data, ctx) => {
    if (data.diagnosisHospitalName) {
      if (!data.diagnosisHospitalState) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"diagnosisHospitalState" is required when "diagnosisHospitalName" is provided',
          path: ['diagnosisHospitalState'],
        });
      }
      if (!data.diagnosisHospitalCity) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"diagnosisHospitalCity" is required when "diagnosisHospitalName" is provided',
          path: ['diagnosisHospitalCity'],
        });
      }
    }

    if (!data.diagnosisHospitalName) {
      if (data.diagnosisHospitalState !== null) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"diagnosisHospitalState" must be null when "diagnosisHospitalName" is not provided',
          path: ['diagnosisHospitalState'],
        });
      }
      if (data.diagnosisHospitalCity !== null) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"diagnosisHospitalCity" must be null when "diagnosisHospitalName" is not provided',
          path: ['diagnosisHospitalCity'],
        });
      }
      if (data.diagnosisHospitalCep !== null) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"diagnosisHospitalCep" must be null when "diagnosisHospitalName" is not provided',
          path: ['diagnosisHospitalCep'],
        });
      }
      if (data.diagnosisHospitalStreet !== null) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"diagnosisHospitalStreet" must be null when "diagnosisHospitalName" is not provided',
          path: ['diagnosisHospitalStreet'],
        });
      }
    }
  });
export type DiagnosisSurveySchema = z.infer<typeof diagnosisSurveySchema>;
