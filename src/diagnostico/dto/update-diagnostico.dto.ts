import { PartialType } from '@nestjs/swagger';
import { CreateDiagnosticoDto } from './create-diagnostico.dto';

export class UpdateDiagnosticoDto extends PartialType(CreateDiagnosticoDto) {}
