import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import type { AuthUser } from '@/common/types';
import { Appointment } from '@/domain/entities/appointment';
import type { PatientCondition } from '@/domain/enums/patients';

interface UpdateAppointmentUseCaseInput {
  id: string;
  user: AuthUser;
  date: Date;
  condition: PatientCondition;
  annotation: string | null;
}

@Injectable()
export class UpdateAppointmentUseCase {
  private readonly logger = new Logger(UpdateAppointmentUseCase.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
  ) {}

  async execute({
    id,
    user,
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

    this.logger.log(
      { id, userId: user.id, userEmail: user.email, userRole: user.role },
      'Appointment updated successfully',
    );
  }
}
