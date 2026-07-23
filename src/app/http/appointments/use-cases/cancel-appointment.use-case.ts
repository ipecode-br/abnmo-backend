import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { can } from '@/common/authorization/can';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { Appointment } from '@/domain/entities/appointment';

interface CancelAppointmentUseCaseInput {
  user: RequestUser;
  id: string;
}

@Injectable()
@Log()
export class CancelAppointmentUseCase {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    private readonly logger: LogService,
  ) {}

  async execute({ id, user }: CancelAppointmentUseCaseInput): Promise<void> {
    const appointment = await this.appointmentsRepository.findOne({
      relations: { specialist: true, patient: true },
      where: { id },
      select: {
        id: true,
        status: true,
        specialist: { id: true },
        patient: { id: true },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Atendimento não encontrado.', {
        cause: `Appointment with ID <${id}> not found`,
      });
    }

    can(
      user,
      ['cancel:appointment', 'cancel:appointment:others'],
      [appointment.patient.id, appointment.specialist?.id || ''],
    );

    if (appointment.status !== 'scheduled') {
      throw new BadRequestException(
        'Este atendimento não pode ser cancelado.',
        {
          cause: `Appointment with ID <${id}> has status <${appointment.status}>`,
        },
      );
    }

    await this.appointmentsRepository.update(id, { status: 'canceled' });

    this.logger.log('Appointment canceled', { id });
  }
}
