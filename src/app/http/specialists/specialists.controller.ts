import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponseSchema } from '@/domain/schemas/base';
import { CreateInviteDto } from '@/domain/schemas/specialist';

import { UpdateSpecialistDto } from './speacialists.dtos';
import { SpecialistsService } from './specialists.service';

@ApiTags('Especialistas')
@Controller('specialists')
export class SpecialistsController {
  constructor(private readonly specialistsService: SpecialistsService) {}

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
