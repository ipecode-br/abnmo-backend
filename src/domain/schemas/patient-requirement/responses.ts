import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { patientSchema } from '../patients';
import { patientRequirementSchema } from '.';

export const patientRequirementItemSchema = patientRequirementSchema
  .pick({
    id: true,
    type: true,
    title: true,
    status: true,
    description: true,
    submittedAt: true,
    approvedAt: true,
    declinedAt: true,
    createdAt: true,
  })
  .extend({ patient: patientSchema.pick({ id: true, name: true }) });
export type PatientRequirementItem = z.infer<
  typeof patientRequirementItemSchema
>;

export const getPatientRequirementsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    requirements: z.array(patientRequirementItemSchema),
    total: z.number(),
  }),
});

export const patientRequirementByPatientIdSchema =
  patientRequirementSchema.pick({
    id: true,
    type: true,
    title: true,
    status: true,
    description: true,
    submittedAt: true,
    approvedAt: true,
    declinedAt: true,
    createdAt: true,
  });
export type PatientRequirementByPatientId = z.infer<
  typeof patientRequirementByPatientIdSchema
>;

export const getPatientRequirementsByPatientIdResponseSchema =
  baseResponseSchema.extend({
    data: z.object({
      requirements: z.array(patientRequirementByPatientIdSchema),
      total: z.number(),
    }),
  });
