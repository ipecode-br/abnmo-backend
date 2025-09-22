import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '@/common/decorators/public.decorator';
import { CreateSpecialistResponseSchema } from '@/domain/schemas/specialist';

import { CreateSpecialistDto } from './specialists.dtos';
import { SpecialistsService } from './specialists.service';

@ApiTags('Especialistas')
@Controller('specialists')
export class SpecialistsController {
  constructor(private readonly specialistsService: SpecialistsService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Cadastra um novo especialista',
    description: `
    Dois modos de operação:
    1. Com "user_id" existente: associa a um usuário já cadastrado (ignora os campos "email" e "name")
    2. Sem "user_id": cria novo usuário automaticamente ("email" e "name" são obrigatórios)
    `,
  })
  public async create(
    @Body() createSpecialistDto: CreateSpecialistDto,
  ): Promise<CreateSpecialistResponseSchema> {
    await this.specialistsService.create(createSpecialistDto);

    return {
      success: true,
      message: 'Cadastro realizado com sucesso.',
    };
  }
}
