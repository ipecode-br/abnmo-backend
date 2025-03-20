import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Length, Matches, MaxLength } from 'class-validator';

export class CreateSupportDto {
  @ApiProperty({
    example: 'Amélia da Silva',
    description: 'Nome completo do apoio.',
    required: true,
  })
  @IsString({ message: 'O nome do apoio deve ser uma string' })
  @MaxLength(100, { message: 'A' })
  nome_apoio: string;

  @ApiProperty({
    example: 'Mãe',
    description: 'Grau de parentesco. Ex: Mãe, Irmão, Primo, etc.',
    required: true,
  })
  @IsString({ message: 'O grau de parentesco deve ser uma string' })
  parentesco: string;

  @ApiProperty({
    example: '11987654321',
    description:
      'Número de WhatsApp do apoio, sem espaços ou caracteres especiais.',
    required: true,
  })
  @IsString()
  @Matches(/^\d{11}$/, { message: 'O Whatsapp deve conter apenas números' })
  @Length(11, 11, { message: 'O Whatsapp deve ter exatamente 11 dígitos' })
  whatsapp: string;

  @ApiProperty({
    example: 1,
    description: 'Identificador do paciente associado ao apoio.',
    required: true,
  })
  @IsInt({ message: 'O id_paciente deve ser um número inteiro' })
  id_paciente: number;
}
