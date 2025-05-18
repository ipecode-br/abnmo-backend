import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateDiagnosticDto {
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
