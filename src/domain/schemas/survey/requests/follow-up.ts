import { surveySchema } from '..';

export const followUpSurveySchema = surveySchema
  .pick({
    followUpSpecialties: true,
    otherFollowUpProfessionals: true,
    followUpHow: true,
    hasHealthInsurance: true,
    nmoMedications: true,
    crisesAfterMedication: true,
    legalActionForMedication: true,
    generalMedications: true,
    hasVisualAlteration: true,
    usesVisualCane: true,
    visualImpairmentAssistance: true,
    visualAssistiveTechnologies: true,
    usesWheelchair: true,
    hasMotorSequelae: true,
    motorImpairmentAssistance: true,
    walkingDistance: true,
    usesWalkingAid: true,
    bladderControl: true,
    bowelFunction: true,
    otherSequelae: true,
    psychologicalMedsBeforeNmo: true,
    psychologicalMedsAfterNmo: true,
    psychologicalDiagnosisAfterNmo: true,
    bloodType: true,
    hasOtherDisease: true,
    otherDiseaseDescription: true,
  })
  .superRefine((data, ctx) => {
    if (data.hasVisualAlteration) {
      if (data.usesVisualCane === null) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"usesVisualCane" is required when "hasVisualAlteration" is true',
          path: ['usesVisualCane'],
        });
      }
      if (!data.visualImpairmentAssistance) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"visualImpairmentAssistance" is required when "hasVisualAlteration" is true',
          path: ['visualImpairmentAssistance'],
        });
      }
    } else {
      if (data.usesVisualCane !== null) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"usesVisualCane" must be null when "hasVisualAlteration" is false',
          path: ['usesVisualCane'],
        });
      }
      if (data.visualImpairmentAssistance !== null) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"visualImpairmentAssistance" must be null when "hasVisualAlteration" is false',
          path: ['visualImpairmentAssistance'],
        });
      }
    }

    if (data.hasMotorSequelae) {
      if (!data.motorImpairmentAssistance) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"motorImpairmentAssistance" is required when "hasMotorSequelae" is true',
          path: ['motorImpairmentAssistance'],
        });
      }
      if (!data.walkingDistance) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"walkingDistance" is required when "hasMotorSequelae" is true',
          path: ['walkingDistance'],
        });
      }
    } else {
      if (data.motorImpairmentAssistance !== null) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"motorImpairmentAssistance" must be null when "hasMotorSequelae" is false',
          path: ['motorImpairmentAssistance'],
        });
      }
      if (data.walkingDistance !== null) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"walkingDistance" must be null when "hasMotorSequelae" is false',
          path: ['walkingDistance'],
        });
      }
    }

    if (data.hasOtherDisease) {
      if (!data.otherDiseaseDescription) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"otherDiseaseDescription" is required when "hasOtherDisease" is true',
          path: ['otherDiseaseDescription'],
        });
      }
    } else if (data.otherDiseaseDescription !== null) {
      ctx.addIssue({
        code: 'custom',
        message:
          '"otherDiseaseDescription" must be null when "hasOtherDisease" is false',
        path: ['otherDiseaseDescription'],
      });
    }
  });
