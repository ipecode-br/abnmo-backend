import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { GetAppointmentsResponseSchema } from '@/domain/schemas/appointments/responses';
import { BaseResponseSchema } from '@/domain/schemas/base';
import { UserSchema } from '@/domain/schemas/user';

import { GetAppointmentsQuery } from './appointments.dtos';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './appointments.dtos';
import { CancelAppointmentUseCase } from './use-cases/cancel-appointment.use-case';
import { CreateAppointmentUseCase } from './use-cases/create-appointment.use-case';
import { GetAppointmentsUseCase } from './use-cases/get-appointments.use-case';
import { UpdateAppointmentUseCase } from './use-cases/update-appointment.use-case';

@ApiTags('Atendimentos')
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly getAppointmentsUseCase: GetAppointmentsUseCase,
    private readonly createAppointmentUseCase: CreateAppointmentUseCase,
    private readonly updateAppointmentUseCase: UpdateAppointmentUseCase,
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
  ) {}

  @Get()
  @Roles(['manager', 'nurse', 'patient', 'specialist'])
  @ApiOperation({ summary: 'Lista todos os atendimentos' })
  async findAll(
    @CurrentUser() user: UserSchema,
    @Query() query: GetAppointmentsQuery,
  ): Promise<GetAppointmentsResponseSchema> {
    const data = await this.getAppointmentsUseCase.execute({ user, query });

    return {
      success: true,
      message: 'Lista de atendimentos retornada com sucesso.',
      data,
    };
  }

  @Post()
  @Roles(['nurse', 'manager'])
  @ApiOperation({ summary: 'Cadastra novo atendimento' })
  async create(
    @CurrentUser() user: UserSchema,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<BaseResponseSchema> {
    await this.createAppointmentUseCase.execute({
      createAppointmentDto,
      userId: user.id,
    });

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
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<BaseResponseSchema> {
    await this.updateAppointmentUseCase.execute({
      id,
      updateAppointmentDto,
      user,
    });

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
  ): Promise<BaseResponseSchema> {
    await this.cancelAppointmentUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Atendimento cancelado com sucesso.',
    };
  }
}
