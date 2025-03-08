import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDiagnosticoDto {
  @ApiProperty({
    example: 5,
    description: 'ID do diagnóstico (deve ser informado manualmente).',
  })
  @IsOptional() // será gerado no service
  @IsInt()
  @IsNotEmpty()
  id_diagnostico: number;

  @ApiProperty({
    example: 'Diagnóstico de hipertensão arterial',
    description: 'Descrição do diagnóstico do paciente',
    required: true,
  })
  @IsString({ message: 'A descrição do diagnóstico deve ser uma string' })
  @MaxLength(40, {
    message: 'A descrição do diagnóstico deve ter no máximo 40 caracteres',
  })
  desc_diagnostico: string;
}
