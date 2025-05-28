import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AuthDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Endereço de e-mail único do usuário.',
  })
  @IsEmail({ allow_ip_domain: false }, { message: 'O e-mail deve ser válido' })
  @MaxLength(320, { message: 'O e-mail deve ter no máximo 320 caracteres' })
  email: string = '';

  @ApiProperty({
    example: 'Senha@123',
    description:
      'Senha do usuário (mínimo 8 caracteres, com números, caractere especial, letras maiúsculas e minúsculas).',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'A senha deve ser uma string válida' })
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  @Matches(/[A-Z]/, {
    message: 'A senha deve conter pelo menos uma letra maiúscula',
  })
  @Matches(/[a-z]/, {
    message: 'A senha deve conter pelo menos uma letra minúscula',
  })
  @Matches(/\d/, { message: 'A senha deve conter pelo menos um número' })
  @Matches(/[\W_]/, {
    message: 'A senha deve conter pelo menos um caractere especial',
  })
  senha: string = '';

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI...',
    description: 'Token de autenticação OAuth do usuário (se aplicável).',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O token_oauth deve ser uma string' })
  token_oauth?: string;
}
