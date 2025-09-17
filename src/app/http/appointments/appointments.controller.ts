import { Body, Controller, Param, Patch, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import {
  CancelAppointmentResponseSchema,
  UpdateAppointmentDto,
  UpdateAppointmentResponseSchema,
} from '@/domain/schemas/appointment';
import { UserSchema } from '@/domain/schemas/user';

import { AppointmentsService } from './appointments.service';

@ApiTags('Atendimentos')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

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
