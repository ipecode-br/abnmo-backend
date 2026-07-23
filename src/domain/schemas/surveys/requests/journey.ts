import { EMPLOYMENT_STATUSES_WITH_DETAILS_REQUIRED } from '@/domain/enums/surveys';

import { surveySchema } from '..';

export const journeySurveySchema = surveySchema
  .pick({
    educationLevel: true,
    employmentStatus: true,
    studyInterruption: true,
    profession: true,
    jobTitle: true,
    salaryRange: true,
    dismissedAfterDiagnosis: true,
    changedProfession: true,
    changedProfessionTo: true,
    currentJobIsPcd: true,
    receivesSicknessBenefit: true,
    receivesBpcLoas: true,
  })
  .superRefine((data, ctx) => {
    const isStudent = data.employmentStatus === 'student';
    const requiresDetails = EMPLOYMENT_STATUSES_WITH_DETAILS_REQUIRED.includes(
      data.employmentStatus,
    );

    if (isStudent) {
      if (!data.studyInterruption) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"studyInterruption" is required when "employmentStatus" is student',
          path: ['studyInterruption'],
        });
      }
    } else if (data.studyInterruption !== null) {
      ctx.addIssue({
        code: 'custom',
        message:
          '"studyInterruption" must be null when "employmentStatus" is not student',
        path: ['studyInterruption'],
      });
    }

    if (requiresDetails) {
      if (!data.profession) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"profession" is required for the selected employment status',
          path: ['profession'],
        });
      }
      if (!data.jobTitle) {
        ctx.addIssue({
          code: 'custom',
          message: '"jobTitle" is required for the selected employment status',
          path: ['jobTitle'],
        });
      }
    } else {
      if (data.profession !== null) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"profession" must be null for the selected employment status',
          path: ['profession'],
        });
      }
      if (data.jobTitle !== null) {
        ctx.addIssue({
          code: 'custom',
          message: '"jobTitle" must be null for the selected employment status',
          path: ['jobTitle'],
        });
      }
    }

    if (data.changedProfession) {
      if (!data.changedProfessionTo) {
        ctx.addIssue({
          code: 'custom',
          message:
            '"changedProfessionTo" is required when "changedProfession" is true',
          path: ['changedProfessionTo'],
        });
      }
    } else if (data.changedProfessionTo !== null) {
      ctx.addIssue({
        code: 'custom',
        message:
          '"changedProfessionTo" must be null when "changedProfession" is false',
        path: ['changedProfessionTo'],
      });
    }
  });
