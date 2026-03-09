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
import type { PatientCondition } from '@/domain/enums/patients';

interface UpdateAppointmentUseCaseInput {
  id: string;
  date: Date;
  condition: PatientCondition;
  annotation: string | null;
}

@Logger()
@Injectable()
export class UpdateAppointmentUseCase {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    private readonly logger: AppLogger,
  ) {}

  async execute({
    id,
    date,
    condition,
    annotation,
  }: UpdateAppointmentUseCaseInput): Promise<void> {
    this.logger.setEvent('update_appointment');

    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Atendimento não encontrado.');
    }

    if (appointment.status === 'canceled') {
      throw new BadRequestException(
        'Não é possível atualizar um atendimento cancelado.',
      );
    }

    await this.appointmentsRepository.update(appointment.id, {
      date,
      condition,
      annotation,
    });

    this.logger.log('Appointment updated successfully', { id });
  }
}
