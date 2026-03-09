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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BaseResponse } from '@/common/dtos';
import type { AuthUser } from '@/common/types';

import {
  CreateAppointmentDto,
  GetAppointmentsQuery,
  GetAppointmentsResponse,
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
  @ApiResponse({ type: GetAppointmentsResponse })
  async getAppointments(
    @Query() query: GetAppointmentsQuery,
    @User() user: AuthUser,
  ): Promise<GetAppointmentsResponse> {
    const data = await this.getAppointmentsUseCase.execute({ user, ...query });

    return {
      success: true,
      message: 'Lista de atendimentos retornada com sucesso.',
      data,
    };
  }

  @Post()
  @Roles(['manager', 'nurse', 'specialist'])
  @ApiOperation({ summary: 'Cadastra um novo atendimento' })
  @ApiResponse({ type: BaseResponse })
  async create(
    @User() user: AuthUser,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<BaseResponse> {
    const {
      date,
      category,
      annotation,
      condition,
      patientId,
      professionalName,
    } = createAppointmentDto;

    await this.createAppointmentUseCase.execute({
      user,
      date,
      category,
      annotation,
      condition,
      patientId,
      professionalName,
    });

    return {
      success: true,
      message: 'Atendimento cadastrado com sucesso.',
    };
  }

  @Put(':id')
  @Roles(['manager', 'nurse', 'specialist'])
  @ApiOperation({ summary: 'Atualiza os dados do atendimento' })
  @ApiResponse({ type: BaseResponse })
  public async update(
    @Param('id') id: string,
    @User() user: AuthUser,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<BaseResponse> {
    await this.updateAppointmentUseCase.execute({
      id,
      user,
      ...updateAppointmentDto,
    });

    return {
      success: true,
      message: 'Atendimento atualizado com sucesso.',
    };
  }

  @Roles(['manager', 'nurse'])
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancela o atendimento' })
  @ApiResponse({ type: BaseResponse })
  async cancel(
    @Param('id') id: string,
    @User() user: AuthUser,
  ): Promise<BaseResponse> {
    await this.cancelAppointmentUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Atendimento cancelado com sucesso.',
    };
  }
}
