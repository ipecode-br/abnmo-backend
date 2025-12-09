import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Appointment } from '@/domain/entities/appointment';
import { UserSchema } from '@/domain/schemas/user';

interface CancelAppointmentUseCaseRequest {
  id: string;
  user: UserSchema;
}

type CancelAppointmentUseCaseResponse = Promise<void>;

@Injectable()
export class CancelAppointmentUseCase {
  private readonly logger = new Logger(CancelAppointmentUseCase.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  async execute({
    id,
    user,
  }: CancelAppointmentUseCaseRequest): CancelAppointmentUseCaseResponse {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Atendimento não encontrado.');
    }

    if (appointment.status === 'canceled') {
      throw new BadRequestException('Este atendimento já está cancelado.');
    }

    await this.appointmentsRepository.save({ id, status: 'canceled' });

    this.logger.log(
      { appointmentId: id, userId: user.id },
      'Appointment canceled successfully.',
    );
  }
}
