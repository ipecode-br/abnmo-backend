import { z } from 'zod';

import { PATIENT_ORDER_BY, PATIENT_STATUSES } from '@/domain/enums/patients';
import { QUERY_ORDERS } from '@/domain/enums/queries';

import { createPatientSupportSchema } from '../patient-support/requests';
import { baseQuerySchema } from '../query';
import { patientSchema } from '.';

export const createPatientSchema = patientSchema
  .pick({
    name: true,
    date_of_birth: true,
    cpf: true,
    gender: true,
    race: true,
    state: true,
    city: true,
    email: true,
    phone: true,
    has_disability: true,
    disability_desc: true,
    take_medication: true,
    medication_desc: true,
    need_legal_assistance: true,
    nmo_diagnosis: true,
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
      has_disability: true,
      disability_desc: true,
      need_legal_assistance: true,
      take_medication: true,
      medication_desc: true,
    }),
  );

export const updatePatientSchema = createPatientSchema
  .omit({ supports: true })
  .merge(patientSchema.pick({ status: true }));

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
