import { IsEmail, Length, Matches, MinLength, IsString } from 'class-validator';

export class CreateUserDto {
  
  @IsString()
  @Length(10, 20, { message: 'O nome deve ter entre 10 e 20 caracteres' })
  name: string;

  @IsEmail({}, { message: 'O e-mail deve ser válido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  @Matches(/[A-Z]/, { message: 'A senha deve conter pelo menos uma letra maiúscula' })
  @Matches(/[a-z]/, { message: 'A senha deve conter pelo menos uma letra minúscula' })
  @Matches(/\d/, { message: 'A senha deve conter pelo menos um número' })
  @Matches(/[\W_]/, { message: 'A senha deve conter pelo menos um caractere especial' })
  password: string;
}
