import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponseSchema } from '@/domain/schemas/base';
import {
  CreateInviteDto,
  FindAllSpecialistsResponseSchema,
} from '@/domain/schemas/specialist';

import {
  FindAllSpecialistQueryDto,
  UpdateSpecialistDto,
} from './specialists.dtos';
import { SpecialistsRepository } from './specialists.repository';
import { SpecialistsService } from './specialists.service';

@ApiTags('Especialistas')
@Controller('specialists')
export class SpecialistsController {
  constructor(
    private readonly specialistsService: SpecialistsService,
    private readonly specialistsRepository: SpecialistsRepository,
  ) {}

  @Get()
  @Roles(['manager'])
  public async findAll(
    @Query() filters: FindAllSpecialistQueryDto,
  ): Promise<FindAllSpecialistsResponseSchema> {
    const { specialists, total } =
      await this.specialistsRepository.findAll(filters);

    return {
      success: true,
      message: 'Lista de especialistas retornada com sucesso.',
      data: { specialists, total },
    };
  }

  @Put(':id')
  @Roles(['specialist'])
  async update(
    @Param('id') id: string,
    @Body() updateSpecialistDto: UpdateSpecialistDto,
  ): Promise<BaseResponseSchema> {
    await this.specialistsService.update(id, updateSpecialistDto);

    return {
      success: true,
      message: 'Atualização realizada com sucesso.',
    };
  }

  @Post('create-invite')
  @ApiOperation({ summary: 'Criação de convite para especialista' })
  async createInvite(
    @Body() body: CreateInviteDto,
  ): Promise<BaseResponseSchema> {
    return this.specialistsService.createInvite(body.email, body.type);
  }
}
