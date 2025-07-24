import { createZodDto } from 'nestjs-zod';
import {
  createPatientSchema,
  findAllPatientSchema,
} from '@/domain/schemas/patient';
export class CreatePatientDto extends createZodDto(createPatientSchema) {}
export class FindAllPatientDto extends createZodDto(findAllPatientSchema) {}
