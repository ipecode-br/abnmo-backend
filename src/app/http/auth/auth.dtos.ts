import { createZodDto } from 'nestjs-zod';

import {
  authUserSchema,
  changePasswordSchema,
  recoverPasswordSchema,
  registerPatientSchema,
  registerUserSchema,
  resetPasswordSchema,
  signInWithEmailSchema,
} from '@/domain/schemas/auth';

export class AuthUserDto extends createZodDto(authUserSchema) {}

export class RegisterPatientDto extends createZodDto(registerPatientSchema) {}

export class RegisterUserDto extends createZodDto(registerUserSchema) {}

export class SignInWithEmailDto extends createZodDto(signInWithEmailSchema) {}

export class RecoverPasswordDto extends createZodDto(recoverPasswordSchema) {}

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}

export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}
