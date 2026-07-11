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
import { ZodResponse } from 'nestjs-zod';

import { RequireFeature } from '@/common/decorators/require-feature.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BaseResponse } from '@/common/dtos';
import { Log } from '@/common/log/log.decorator';
import type { RequestUser } from '@/common/types';

import {
  CreateAppointmentBody,
  GetAppointmentsQuery,
  GetAppointmentsResponse,
  UpdateAppointmentBody,
} from './appointments.dtos';
import { CancelAppointmentUseCase } from './use-cases/cancel-appointment.use-case';
import { CreateAppointmentUseCase } from './use-cases/create-appointment.use-case';
import { GetAppointmentsUseCase } from './use-cases/get-appointments.use-case';
import { UpdateAppointmentUseCase } from './use-cases/update-appointment.use-case';

@ApiTags('Atendimentos')
@Controller('appointments')
@Roles(['all'])
export class AppointmentsController {
  constructor(
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
    private readonly createAppointmentUseCase: CreateAppointmentUseCase,
    private readonly getAppointmentsUseCase: GetAppointmentsUseCase,
    private readonly updateAppointmentUseCase: UpdateAppointmentUseCase,
  ) {}

  @Get()
  @RequireFeature(['read:appointment', 'read:appointment:others'])
  @ApiOperation({ summary: 'Lista todos os atendimentos' })
  @ZodResponse({ type: GetAppointmentsResponse, status: 200 })
  async getAppointments(
    @Query() query: GetAppointmentsQuery,
    @User() user: RequestUser,
  ): Promise<GetAppointmentsResponse> {
    const data = await this.getAppointmentsUseCase.execute({ user, ...query });

    return {
      success: true,
      message: 'Lista de atendimentos retornada com sucesso.',
      data,
    };
  }

  @Post()
  @Log('create_appointment')
  @RequireFeature('create:appointment')
  @ApiOperation({ summary: 'Cadastra um novo atendimento' })
  @ZodResponse({ type: BaseResponse, status: 201 })
  async create(
    @User() user: RequestUser,
    @Body() body: CreateAppointmentBody,
  ): Promise<BaseResponse> {
    await this.createAppointmentUseCase.execute({ user, ...body });

    return {
      success: true,
      message: 'Atendimento cadastrado com sucesso.',
    };
  }

  @Put(':id')
  @Log('update_appointment')
  @RequireFeature(['update:appointment', 'update:appointment:others'])
  @ApiOperation({ summary: 'Atualiza os dados do atendimento' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  public async update(
    @Param('id') id: string,
    @Body() body: UpdateAppointmentBody,
  ): Promise<BaseResponse> {
    await this.updateAppointmentUseCase.execute({ id, ...body });

    return {
      success: true,
      message: 'Atendimento atualizado com sucesso.',
    };
  }

  @Patch(':id/cancel')
  @Log('cancel_appointment')
  @RequireFeature(['cancel:appointment', 'cancel:appointment:others'])
  @ApiOperation({ summary: 'Cancela o atendimento' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async cancel(@Param('id') id: string): Promise<BaseResponse> {
    await this.cancelAppointmentUseCase.execute({ id });

    return {
      success: true,
      message: 'Atendimento cancelado com sucesso.',
    };
  }
}
