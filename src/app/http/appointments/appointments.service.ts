import {
  BadRequestException,
  ForbiddenException,
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
    updateAppointmentDto: UpdateAppointmentDto,
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

    Object.assign(appointment, updateAppointmentDto);

    await this.appointmentsRepository.save(appointment);

    this.logger.log(
      { id: appointment.id, user: user.id },
      'Atendimento atualizado com sucesso.',
    );
  }
}
