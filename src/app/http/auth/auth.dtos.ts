import { createZodDto } from 'nestjs-zod';

import { signInWithEmailSchema } from '@/domain/schemas/auth';

export class SignInWithEmailDto extends createZodDto(signInWithEmailSchema) {}
