import { Controller, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { CancelAppointmentResponseSchema } from '@/domain/schemas/appointment';
import { UserSchema } from '@/domain/schemas/user';

import { AppointmentsService } from './appointments.service';

@ApiTags('Atendimentos')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Roles(['nurse', 'manager', 'specialist'])
  @Patch(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: UserSchema,
  ): Promise<CancelAppointmentResponseSchema> {
    await this.appointmentsService.cancelAppointment(id, user);

    return {
      success: true,
      message: 'Atendimento cancelado com sucesso.',
    };
  }
}
