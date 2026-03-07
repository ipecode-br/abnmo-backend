import { z } from 'zod';

import { PATIENT_ORDER_BY, PATIENT_STATUSES } from '@/domain/enums/patients';
import { QUERY_ORDERS } from '@/domain/enums/queries';

import { createPatientSupportSchema } from '../patient-support/requests';
import { baseQuerySchema } from '../query';
import { patientSchema } from '.';

export const createPatientSchema = patientSchema
  .pick({
    name: true,
    dateOfBirth: true,
    cpf: true,
    gender: true,
    race: true,
    state: true,
    city: true,
    email: true,
    phone: true,
    hasDisability: true,
    disabilityDesc: true,
    takeMedication: true,
    medicationDesc: true,
    needLegalAssistance: true,
    nmoDiagnosis: true,
  })
  .extend({
    supports: z
      .array(
        createPatientSupportSchema.pick({
          name: true,
          phone: true,
          kinship: true,
        }),
      )
      .min(1),
  })
  .merge(
    patientSchema.pick({
      hasDisability: true,
      disabilityDesc: true,
      needLegalAssistance: true,
      takeMedication: true,
      medicationDesc: true,
    }),
  );

export const updatePatientSchema = createPatientSchema.omit({ supports: true });

export const getPatientsQuerySchema = baseQuerySchema
  .pick({
    search: true,
    page: true,
    perPage: true,
    startDate: true,
    endDate: true,
  })
  .extend({
    status: z.enum(PATIENT_STATUSES).optional(),
    order: z.enum(QUERY_ORDERS).optional().default('ASC'),
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
