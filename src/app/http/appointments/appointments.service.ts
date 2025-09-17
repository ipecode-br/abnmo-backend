import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { UserSchema } from '@/domain/schemas/user';

import { UpdateAppointmentDto } from './appointments.dtos';
import { AppointmentsRepository } from './appointments.repository';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
  ) {}

  public async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
    user: UserSchema,
  ): Promise<void> {
    const appointment = await this.appointmentsRepository.findById(id);

    if (!appointment) {
      throw new NotFoundException('Atendimento não encontrado.');
    }

    if (appointment.status === 'canceled') {
      throw new BadRequestException(
        'Não é possível atualizar um atendimento cancelado.',
      );
    }

    Object.assign(appointment, updateAppointmentDto);

    await this.appointmentsRepository.update(appointment);

    this.logger.log(
      { id: appointment.id, user: user.id },
      'Appointment updated successfully.',
    );
  }

  async cancel(id: string, user: UserSchema): Promise<void> {
    const appointment = await this.appointmentsRepository.findById(id);

    if (!appointment) {
      throw new NotFoundException('Atendimento não encontrado.');
    }

    if (appointment.status === 'canceled') {
      throw new BadRequestException('Este atendimento já está cancelado.');
    }

    await this.appointmentsRepository.cancel(appointment.id);

    this.logger.log(
      { id: appointment.id, userId: user.id },
      'Appointment canceled successfully.',
    );
  }
}
