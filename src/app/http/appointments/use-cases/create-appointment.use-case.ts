import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Appointment } from '@/domain/entities/appointment';
import { Patient } from '@/domain/entities/patient';
import { User } from '@/domain/entities/user';

import type { AuthUserDto } from '../../auth/auth.dtos';
import type { CreateAppointmentDto } from '../appointments.dtos';

interface CreateAppointmentUseCaseInput {
  user: AuthUserDto;
  createAppointmentDto: CreateAppointmentDto;
}

@Injectable()
export class CreateAppointmentUseCase {
  private readonly logger = new Logger(CreateAppointmentUseCase.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async execute({
    createAppointmentDto,
    user,
  }: CreateAppointmentUseCaseInput): Promise<void> {
    const { patient_id: patientId } = createAppointmentDto;

    const patient = await this.patientsRepository.findOne({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const appointmentPayload: Partial<Appointment> = {
      ...createAppointmentDto,
      patient_id: patientId,
      status: 'scheduled',
      created_by: user.id,
    };

    if (user.role === 'specialist') {
      const specialist = await this.usersRepository.findOne({
        select: { id: true, name: true, specialty: true },
        where: { id: user.id },
      });

      if (!specialist || !specialist.specialty) {
        throw new NotFoundException('Especialista não encontrado.');
      }

      appointmentPayload.user_id = specialist.id;
      appointmentPayload.professional_name = specialist.name;
      appointmentPayload.category = specialist.specialty;
    }

    const appointment = this.appointmentsRepository.create(appointmentPayload);
    await this.appointmentsRepository.save(appointment);

    this.logger.log(
      {
        id: appointment.id,
        patientId,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
      },
      'Appointment created successfully',
    );
  }
}
