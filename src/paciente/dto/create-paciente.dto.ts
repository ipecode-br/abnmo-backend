import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { siglasEstados } from 'src/common/utils/siglas-estados';

export class CreatePacienteDto {
  @ApiProperty({ example: 1, description: 'Identificador único do usuário' })
  @IsInt({ message: 'O id_usuario deve ser um número inteiro' })
  id_usuario: number;

  @ApiProperty({
    example: 'https://example.com/uploads/profile.jpg',
    description: 'URL da foto de perfil do usuário. Deve ser um link válido.',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'A URL da foto deve ser válida' })
  @MaxLength(255)
  url_foto?: string;

  @ApiProperty({
    example: '1995-08-25T00:00:00.000Z',
    description: 'Data de nascimento no formato ISO 8601.',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  data_nascimento?: Date;

  @ApiProperty({
    example: '12345678901',
    description: 'CPF do usuário (apenas números, 11 dígitos).',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{11}$/, { message: 'O CPF deve conter apenas números' })
  @Length(11, 11, { message: 'O CPF deve ter exatamente 11 caracteres' })
  cpf?: string;

  @ApiProperty({
    example: 'Feminino',
    description:
      'Gênero do usuário (exemplo: Masculino, Feminino, Não-binário).',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  desc_genero?: string;

  @ApiProperty({
    example: 'São Paulo',
    description: 'Cidade onde o usuário reside.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cidade?: string;

  @ApiProperty({
    example: 'SP',
    description: 'Sigla do estado (exemplo: SP, RJ, MG).',
    required: false,
  })
  @Transform(({ value }: { value: unknown }): string | undefined =>
    typeof value === 'string' ? value.toUpperCase() : undefined,
  )
  @IsIn(siglasEstados, {
    message: 'Estado inválido. Use uma sigla de estado brasileira válida.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2, {
    message: 'A sigla do estado deve ter exatamente 2 caracteres',
  })
  sigla_estado?: string;

  @ApiProperty({
    example: '11987654321',
    description: 'Número de WhatsApp do usuário (somente números, 11 dígitos).',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(11, 11, { message: 'O WhatsApp deve ter exatamente 11 caracteres' })
  whatsapp?: string;

  @ApiProperty({
    example: 1,
    description:
      'Indica se o usuário possui alguma deficiência. 1 = Sim, 0 = Não.',
  })
  @IsBoolean({
    message: 'possui_deficiencia deve ser um booleano (true ou false)',
  })
  possui_deficiencia: boolean;

  @ApiProperty({
    example: 'Deficiência visual e auditiva',
    description: 'Descrição da deficiência, se houver.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  desc_deficiencias?: string;

  @ApiProperty({
    example: 0,
    description:
      'Indica se o usuário precisa de assistência legal. 1 = Sim, 0 = Não.',
  })
  @IsBoolean({
    message: 'precisa_assist_legal deve ser um booleano (true ou false)',
  })
  precisa_assist_legal: boolean;

  @ApiProperty({
    example: 1,
    description:
      'Indica se o usuário faz uso contínuo de medicamentos. 1 = Sim, 0 = Não.',
  })
  @IsBoolean({
    message: 'usa_medicamento deve ser um booleano (true ou false)',
  })
  usa_medicamento: boolean;

  @ApiProperty({
    example: 'Medicamento para pressão alta, uso diário.',
    description:
      'Descrição dos medicamentos utilizados pelo usuário, se houver.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  desc_medicamentos?: string;

  @ApiProperty({
    example: 'diagnostico_usuario.pdf',
    description: 'Nome do arquivo contendo o diagnóstico médico.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  filename_diagnostico?: string;

  @ApiProperty({
    example: 1,
    description: 'Identificador do diagnóstico associado ao paciente.',
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'O id_diagnostico deve ser um número inteiro' })
  id_diagnostico?: number;
}
