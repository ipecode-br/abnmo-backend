import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { BaseResponseSchema } from '@/domain/schemas/base';
import { CreateInviteDto } from '@/domain/schemas/specialist';

import { SpecialistsService } from './specialists.service';

@ApiTags('Especialistas')
@Controller('specialists')
export class SpecialistsController {
  constructor(private readonly specialistsService: SpecialistsService) {}

  @Post('create-invite')
  @ApiOperation({ summary: 'Criação de convite para especialista' })
  async createInvite(
    @Body() body: CreateInviteDto,
  ): Promise<BaseResponseSchema> {
    return this.specialistsService.createInvite(body.email, body.type);
  }
}
