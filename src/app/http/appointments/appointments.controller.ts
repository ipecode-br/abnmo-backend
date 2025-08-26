import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AppointmentsService } from './appointments.service';

@ApiTags('Atendimentos')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}
}
