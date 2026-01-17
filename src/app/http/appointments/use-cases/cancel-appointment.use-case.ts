import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Appointment } from '@/domain/entities/appointment';

import type { AuthUserDto } from '../../auth/auth.dtos';

interface CancelAppointmentUseCaseInput {
  id: string;
  user: AuthUserDto;
}

@Injectable()
export class CancelAppointmentUseCase {
  private readonly logger = new Logger(CancelAppointmentUseCase.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  async execute({ id, user }: CancelAppointmentUseCaseInput): Promise<void> {
    const appointment = await this.appointmentsRepository.findOne({
      select: { id: true, status: true },
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
      { id, userId: user.id, userEmail: user.email, role: user.role },
      'Appointment canceled successfully.',
    );
  }
}
