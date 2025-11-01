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
import { FindAllAppointmentsResponseSchema } from '@/domain/schemas/appointment';
import { BaseResponseSchema } from '@/domain/schemas/base';
import { UserSchema } from '@/domain/schemas/user';

import {
  CreateAppointmentDto,
  FindAllAppointmentsQueryDto,
  UpdateAppointmentDto,
} from './appointments.dtos';
import { AppointmentsRepository } from './appointments.repository';
import { AppointmentsService } from './appointments.service';

@ApiTags('Atendimentos')
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly appointmentsRepository: AppointmentsRepository,
  ) {}

  @Get()
  @Roles(['manager', 'nurse', 'patient', 'specialist'])
  @ApiOperation({ summary: 'Lista todos os atendimentos' })
  async findAll(
    @CurrentUser() user: UserSchema,
    @Query() filters: FindAllAppointmentsQueryDto,
  ): Promise<FindAllAppointmentsResponseSchema> {
    const { appointments, total } = await this.appointmentsRepository.findAll(
      user,
      filters,
    );

    return {
      success: true,
      message: 'Lista de atendimentos retornada com sucesso.',
      data: { appointments, total },
    };
  }

  @Post()
  @Roles(['nurse', 'manager'])
  @ApiOperation({ summary: 'Cadastra novo atendimento' })
  async create(
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<BaseResponseSchema> {
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
  ): Promise<BaseResponseSchema> {
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
  ): Promise<BaseResponseSchema> {
    await this.appointmentsService.cancel(id, user);

    return {
      success: true,
      message: 'Atendimento cancelado com sucesso.',
    };
  }
}
