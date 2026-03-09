import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Logger } from '@/common/log/logger.decorator';
import { AppLogger } from '@/common/log/logger.service';
import { Appointment } from '@/domain/entities/appointment';

interface CancelAppointmentUseCaseInput {
  id: string;
}

@Logger()
@Injectable()
export class CancelAppointmentUseCase {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    private readonly logger: AppLogger,
  ) {}

  async execute({ id }: CancelAppointmentUseCaseInput): Promise<void> {
    this.logger.setEvent('cancel_appointment');

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

    await this.appointmentsRepository.update({ id }, { status: 'canceled' });

    this.logger.log('Appointment canceled successfully', { id });
  }
}
