import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Appointment } from '@/domain/entities/appointment';
import { Patient } from '@/domain/entities/patient';

import type { AuthUserDto } from '../../auth/auth.dtos';
import type { CreateAppointmentDto } from '../appointments.dtos';

interface CreateAppointmentUseCaseRequest {
  createAppointmentDto: CreateAppointmentDto;
  user: AuthUserDto;
}

@Injectable()
export class CreateAppointmentUseCase {
  private readonly logger = new Logger(CreateAppointmentUseCase.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  async execute({
    createAppointmentDto,
    user,
  }: CreateAppointmentUseCaseRequest): Promise<void> {
    const { patient_id: patientId, date } = createAppointmentDto;

    const MAX_APPOINTMENT_MONTHS_LIMIT = 3;
    const appointmentDate = new Date(date);
    const maxAppointmentDate = new Date();

    maxAppointmentDate.setMonth(
      maxAppointmentDate.getMonth() + MAX_APPOINTMENT_MONTHS_LIMIT,
    );

    if (appointmentDate > maxAppointmentDate) {
      throw new BadRequestException(
        'A data de atendimento deve estar dentro dos próximos 3 meses.',
      );
    }

    const patient = await this.patientsRepository.findOne({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patient) {
      throw new BadRequestException('Paciente não encontrado.');
    }

    const appointment = this.appointmentsRepository.create({
      ...createAppointmentDto,
      created_by: user.id,
    });

    await this.appointmentsRepository.save(appointment);

    this.logger.log(
      {
        id: appointment.id,
        patientId: patientId,
        userId: user.id,
        userEmail: user.email,
        role: user.role,
      },
      'Appointment created successfully',
    );
  }
}
