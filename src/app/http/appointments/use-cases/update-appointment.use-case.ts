import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { Appointment } from '@/domain/entities/appointment';
import type { PatientCondition } from '@/domain/enums/patients';

interface UpdateAppointmentUseCaseInput {
  id: string;
  date: Date;
  condition: PatientCondition;
  annotation: string | null;
}

@Injectable()
@Log()
export class UpdateAppointmentUseCase {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    private readonly logger: LogService,
  ) {}

  async execute({
    id,
    date,
    condition,
    annotation,
  }: UpdateAppointmentUseCaseInput): Promise<void> {
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
