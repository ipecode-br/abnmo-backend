import { z } from 'zod';

import { baseResponseSchema } from '../base';
import { patientSchema } from '../patient';
import { patientRequirementSchema } from '.';

export const patientRequirementItemSchema = patientRequirementSchema
  .pick({
    id: true,
    type: true,
    title: true,
    status: true,
    description: true,
    submitted_at: true,
    approved_at: true,
    created_at: true,
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
export type GetPatientRequirementsResponse = z.infer<
  typeof getPatientRequirementsResponseSchema
>;

export const patientRequirementByPatientIdSchema =
  patientRequirementSchema.pick({
    id: true,
    type: true,
    title: true,
    status: true,
    submitted_at: true,
    approved_at: true,
    created_at: true,
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
export type GetPatientRequirementsByPatientIdResponse = z.infer<
  typeof getPatientRequirementsByPatientIdResponseSchema
>;
