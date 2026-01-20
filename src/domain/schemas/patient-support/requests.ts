import { patientSupportSchema } from '.';

export const createPatientSupportSchema = patientSupportSchema.pick({
  patient_id: true,
  name: true,
  phone: true,
  kinship: true,
});

export const updatePatientSupportSchema = patientSupportSchema.pick({
  name: true,
  phone: true,
  kinship: true,
});
