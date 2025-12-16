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
import type { UpdateAppointmentDto } from '../appointments.dtos';

interface UpdateAppointmentUseCaseRequest {
  id: string;
  user: AuthUserDto;
  updateAppointmentDto: UpdateAppointmentDto;
}

type UpdateAppointmentUseCaseResponse = Promise<void>;

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
    updateAppointmentDto,
  }: UpdateAppointmentUseCaseRequest): UpdateAppointmentUseCaseResponse {
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

    Object.assign(appointment, updateAppointmentDto);

    await this.appointmentsRepository.save(appointment);

    this.logger.log(
      { appointmentId: id, userId: user.id, userEmail: user.email },
      'Appointment updated successfully.',
    );
  }
}
