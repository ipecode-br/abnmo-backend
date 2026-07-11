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
import { RequestUser } from '@/common/types';
import { Appointment } from '@/domain/entities/appointment';
import type { PatientCondition } from '@/domain/enums/patients';

interface UpdateAppointmentUseCaseInput {
  user: RequestUser;
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
    user,
    condition,
    annotation,
  }: UpdateAppointmentUseCaseInput): Promise<void> {
    const appointment = await this.appointmentsRepository.findOne({
      select: { id: true, status: true, specialist: { id: true } },
      relations: { specialist: true },
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Atendimento não encontrado.', {
        cause: `Appointment with ID <${id}> not found`,
      });
    }

    can(
      user,
      ['update:appointment', 'update:appointment:others'],
      appointment.specialist?.id,
    );

    if (appointment.status === 'canceled') {
      throw new BadRequestException(
        'Não é possível atualizar um atendimento cancelado.',
        { cause: `Appointment with ID <${id}> is already canceled` },
      );
    }

    await this.appointmentsRepository.update(appointment.id, {
      date,
      condition,
      annotation,
    });

    this.logger.log('Appointment updated', { id });
  }
}
