import { IsDateString, IsIn, IsOptional, ValidateIf } from 'class-validator';

export class FindPatientDto {
  @IsOptional()
  @IsIn(['ativo', 'inativo'], {
    message: 'O status deve ser "ativo" ou "inativo"',
  })
  status?: 'ativo' | 'inativo';

  @IsOptional()
  @IsIn(['name', 'created_at', 'status'])
  sortBy?: 'name' | 'created_at' | 'status';

  @IsOptional()
  @IsIn(['ASC', 'DESC'], {
    message: 'A ordem deve ser "ASC" ou "DESC"',
  })
  order?: 'ASC' | 'DESC';

  @ValidateIf((dto: FindPatientDto) => dto.endDate !== undefined)
  @IsDateString({}, { message: 'A data inicial é inválida ou está faltando' })
  startDate: string;

  @ValidateIf((dto: FindPatientDto) => dto.startDate !== undefined)
  @IsDateString({}, { message: 'A data final é inválida ou está faltando' })
  endDate: string;
}
