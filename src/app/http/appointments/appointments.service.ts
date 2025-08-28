import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { UpdateAppointmentDto } from '@/domain/schemas/appointment';
import { UserSchema } from '@/domain/schemas/user';

import { AppointmentsRepository } from './appointments.repository';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
  ) {}

  async cancelAppointment(id: string, user: UserSchema): Promise<void> {
    const appointment = await this.appointmentsRepository.findById(id);

    if (!appointment) {
      throw new NotFoundException('Atendimento não encontrado.');
    }

    if (!['nurse', 'manager', 'specialist'].includes(user.role)) {
      throw new ForbiddenException(
        'Você não tem permissão para cancelar atendimento.',
      );
    }

    if (appointment.status === 'canceled') {
      throw new BadRequestException('Este atendimento já está cancelado.');
    }

    appointment.status = 'canceled';

    await this.appointmentsRepository.save(appointment);

    this.logger.log(
      { id: appointment.id, user: user.id },
      'Atendimento cancelado com sucesso.',
    );
  }

  public async update(
    id: string,
    payload: UpdateAppointmentDto,
    user: UserSchema,
  ): Promise<void> {
    if (!['nurse', 'manager', 'specialist'].includes(user.role)) {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este atendimento.',
      );
    }

    const appointment = await this.appointmentsRepository.findById(id);

    if (!appointment) {
      throw new NotFoundException('Atendimento não encontrado.');
    }

    if (appointment.status === 'canceled') {
      throw new BadRequestException(
        'Não é possível atualizar um atendimento cancelado.',
      );
    }

    if (payload.date !== undefined && payload.date !== null) {
      appointment.date = payload.date;
    }

    if (payload.status !== undefined && payload.status !== null) {
      appointment.status = payload.status;
    }

    if (payload.condition !== undefined) {
      appointment.condition = payload.condition;
    }

    if (payload.annotation !== undefined) {
      appointment.annotation = payload.annotation;
    }

    await this.appointmentsRepository.save(appointment);

    this.logger.log(
      { id: appointment.id, user: user.id },
      'Atendimento atualizado com sucesso.',
    );
  }
}
