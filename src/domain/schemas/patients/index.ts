import { userSchema } from '@/domain/schemas/users';

export const patientSchema = userSchema.pick({
  id: true,
  name: true,
  email: true,
  phone: true,
  cpf: true,
  susId: true,
  status: true,
  avatarUrl: true,
  updatedAt: true,
  createdAt: true,
  supportContacts: true,
});
