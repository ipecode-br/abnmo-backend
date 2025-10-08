import { Body, Controller, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import {
  CancelAppointmentResponseSchema,
  CreateAppointmentResponseSchema,
  UpdateAppointmentResponseSchema,
} from '@/domain/schemas/appointment';
import { UserSchema } from '@/domain/schemas/user';

import type {
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './appointments.dtos';
import { AppointmentsService } from './appointments.service';

@ApiTags('Atendimentos')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(['nurse', 'manager'])
  @ApiOperation({ summary: 'Cadastra novo atendimento' })
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<CreateAppointmentResponseSchema> {
    await this.appointmentsService.create(createAppointmentDto);

    return {
      success: true,
      message: 'Atendimento cadastrado com sucesso.',
    };
  }

  @Put(':id')
  @Roles(['nurse', 'manager', 'specialist'])
  public async update(
    @Param('id') id: string,
    @CurrentUser() user: UserSchema,
    @Body() body: UpdateAppointmentDto,
  ): Promise<UpdateAppointmentResponseSchema> {
    await this.appointmentsService.update(id, body, user);

    return {
      success: true,
      message: 'Atendimento atualizado com sucesso.',
    };
  }

  @Roles(['nurse', 'manager', 'specialist'])
  @Patch(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: UserSchema,
  ): Promise<CancelAppointmentResponseSchema> {
    await this.appointmentsService.cancel(id, user);

    return {
      success: true,
      message: 'Atendimento cancelado com sucesso.',
    };
  }
}
