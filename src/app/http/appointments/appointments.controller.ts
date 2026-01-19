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

import { AuthUser } from '@/common/decorators/auth-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { GetAppointmentsResponse } from '@/domain/schemas/appointments/responses';
import { BaseResponse } from '@/domain/schemas/base';

import type { AuthUserDto } from '../auth/auth.dtos';
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
  @Roles(['manager', 'nurse', 'specialist', 'patient'])
  @ApiOperation({ summary: 'Lista todos os atendimentos' })
  async getAppointments(
    @Query() query: GetAppointmentsQuery,
    @AuthUser() user: AuthUserDto,
  ): Promise<GetAppointmentsResponse> {
    const data = await this.getAppointmentsUseCase.execute({ query, user });

    return {
      success: true,
      message: 'Lista de atendimentos retornada com sucesso.',
      data,
    };
  }

  @Post()
  @Roles(['nurse', 'manager'])
  @ApiOperation({ summary: 'Cadastra um novo atendimento' })
  async create(
    @AuthUser() user: AuthUserDto,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<BaseResponse> {
    await this.createAppointmentUseCase.execute({ user, createAppointmentDto });

    return {
      success: true,
      message: 'Atendimento cadastrado com sucesso.',
    };
  }

  @Put(':id')
  @Roles(['nurse', 'manager', 'specialist'])
  @ApiOperation({ summary: 'Atualiza os dados do atendimento' })
  public async update(
    @Param('id') id: string,
    @AuthUser() user: AuthUserDto,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<BaseResponse> {
    await this.updateAppointmentUseCase.execute({
      id,
      user,
      updateAppointmentDto,
    });

    return {
      success: true,
      message: 'Atendimento atualizado com sucesso.',
    };
  }

  @Roles(['nurse', 'manager', 'specialist'])
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancela o atendimento' })
  async cancel(
    @Param('id') id: string,
    @AuthUser() user: AuthUserDto,
  ): Promise<BaseResponse> {
    await this.cancelAppointmentUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Atendimento cancelado com sucesso.',
    };
  }
}
