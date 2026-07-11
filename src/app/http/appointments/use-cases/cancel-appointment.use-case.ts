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
      ['cancel:appointment', 'cancel:appointment:others'],
      appointment.specialist?.id,
    );

    if (appointment.status === 'canceled') {
      throw new BadRequestException('Este atendimento já está cancelado.', {
        cause: `Appointment with ID <${id}> is already canceled`,
      });
    }

    await this.appointmentsRepository.update(id, { status: 'canceled' });

    this.logger.log('Appointment canceled', { id });
  }
}
