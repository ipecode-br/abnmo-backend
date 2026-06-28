import { z } from 'zod';

import { userSchema } from '@/domain/schemas/users';

export const patientSchema = userSchema.pick({
  id: true,
  name: true,
  email: true,
  cpf: true,
  avatarUrl: true,
  status: true,
  susId: true,
  supportContacts: true,
  updatedAt: true,
  createdAt: true,
});
export type PatientSchema = z.infer<typeof patientSchema>;
