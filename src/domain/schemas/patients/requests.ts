import { z } from 'zod';

import { BRAZILIAN_STATES } from '@/constants/brazilian-states';
import {
  PATIENT_GENDERS,
  PATIENT_ORDER_BY,
  PATIENT_STATUSES,
} from '@/domain/enums/patients';

import { createPatientSupportSchema } from '../patient-support/requests';
import { baseQuerySchema } from '../query';
import { emailSchema, nameSchema, phoneSchema } from '../shared';
import { patientSchema } from '.';

export const createPatientSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    gender: z.enum(PATIENT_GENDERS).default('prefer_not_to_say'),
    date_of_birth: z.coerce.date(),
    phone: phoneSchema,
    cpf: z.string().max(11),
    state: z.enum(BRAZILIAN_STATES),
    city: z.string(),
  })
  .merge(
    patientSchema.pick({
      has_disability: true,
      disability_desc: true,
      need_legal_assistance: true,
      take_medication: true,
      medication_desc: true,
      nmo_diagnosis: true,
    }),
  );
export type CreatePatient = z.infer<typeof createPatientSchema>;

export const patientScreeningSchema = createPatientSchema.extend({
  supports: z
    .array(
      createPatientSupportSchema.pick({
        name: true,
        phone: true,
        kinship: true,
      }),
    )
    .nullable()
    .default([]),
});
export type PatientScreening = z.infer<typeof patientScreeningSchema>;

export const updatePatientSchema = patientScreeningSchema
  .omit({ supports: true })
  .merge(patientSchema.pick({ status: true }));
export type UpdatePatient = z.infer<typeof updatePatientSchema>;

export const getPatientsQuerySchema = baseQuerySchema
  .pick({
    search: true,
    order: true,
    page: true,
    perPage: true,
    startDate: true,
    endDate: true,
  })
  .extend({
    status: z.enum(PATIENT_STATUSES).optional(),
    orderBy: z.enum(PATIENT_ORDER_BY).optional().default('name'),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate < data.endDate;
      }
      return true;
    },
    {
      message: 'It should be greater than `startDate`',
      path: ['endDate'],
    },
  );
export type GetPatientsQuery = z.infer<typeof getPatientsQuerySchema>;
