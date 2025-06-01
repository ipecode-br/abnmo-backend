import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'João da Silva',
    description: 'Nome completo do usuário.',
  })
  @IsString({ message: 'O nome deve ser uma string válida' })
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres' })
  fullname: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Endereço de e-mail único do usuário.',
  })
  @IsEmail({ allow_ip_domain: false }, { message: 'O e-mail deve ser válido' })
  @MaxLength(320, { message: 'O e-mail deve ter no máximo 320 caracteres' })
  email: string;

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
  password?: string;

  @ApiProperty({
    example: 0,
    description: 'Indica se o login foi feito pelo Facebook. 1 = Sim, 0 = Não.',
  })
  @IsOptional()
  @IsBoolean({
    message: 'O campo flag_login_facebook deve ser um booleano (true ou false)',
  })
  flag_login_facebook: boolean;

  @ApiProperty({
    example: 0,
    description: 'Indica se o login foi feito pelo Gmail. 1 = Sim, 0 = Não.',
  })
  @IsOptional()
  @IsBoolean({
    message: 'O campo flag_login_gmail deve ser um booleano (true ou false)',
  })
  flag_login_gmail: boolean;

  @ApiProperty({
    example: 'abc123xyz',
    description: 'Identificador OAuth do usuário (se aplicável).',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O id_oauth deve ser uma string' })
  @MaxLength(255, { message: 'O id_oauth deve ter no máximo 255 caracteres' })
  id_oauth?: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI...',
    description: 'Token de autenticação OAuth do usuário (se aplicável).',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O token_oauth deve ser uma string' })
  token_oauth?: string;

  @ApiProperty({
    example: 1,
    description: 'Indica se o usuário está ativo. 1 = Sim, 0 = Não.',
  })
  @IsOptional()
  @IsBoolean({
    message: 'O campo flag_ativo deve ser um booleano (true ou false)',
  })
  flag_active: boolean;

  @ApiProperty({
    example: 0,
    description:
      'Indica se o usuário foi deletado logicamente. 1 = Sim, 0 = Não.',
  })
  @IsOptional()
  @IsBoolean({
    message: 'O campo flag_deletado deve ser um booleano (true ou false)',
  })
  flag_is_removed: boolean;
}
