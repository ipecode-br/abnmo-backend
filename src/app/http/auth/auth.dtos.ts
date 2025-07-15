import { createZodDto } from 'nestjs-zod';

import { signInWithEmailSchema } from '@/domain/schemas/auth';
import { createAuthTokenSchema } from '@/domain/schemas/token';

export class SignInWithEmailDto extends createZodDto(signInWithEmailSchema) {}

export class CreateAuthTokenDto extends createZodDto(createAuthTokenSchema) {}
