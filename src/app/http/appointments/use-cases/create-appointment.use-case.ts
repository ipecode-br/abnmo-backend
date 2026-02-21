import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Appointment } from '@/domain/entities/appointment';
import { Patient } from '@/domain/entities/patient';
import { User } from '@/domain/entities/user';
import type { PatientCondition } from '@/domain/enums/patients';
import type { SpecialtyCategory } from '@/domain/enums/shared';

import type { AuthUserDto } from '../../auth/auth.dtos';

interface CreateAppointmentUseCaseInput {
  user: AuthUserDto;
  patientId: string;
  date: Date;
  condition: PatientCondition;
  annotation: string | null;
  professionalName: string | null;
  category?: SpecialtyCategory;
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
    user,
    patientId,
    date,
    condition,
    annotation,
    category,
    professionalName,
  }: CreateAppointmentUseCaseInput): Promise<void> {
    const patient = await this.patientsRepository.findOne({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const appointmentPayload: Partial<Appointment> = {
      patient_id: patientId,
      date,
      category,
      condition,
      professional_name: professionalName,
      annotation,
      status: 'scheduled',
      created_by: user.id,
    };

    if (user.role === 'specialist') {
      if (category || professionalName) {
        throw new BadRequestException(
          'Especialistas não devem informar categoria ou profissional.',
        );
      }

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

    if (!appointmentPayload.category) {
      throw new BadRequestException(
        'A categoria do atendimento é obrigatória.',
      );
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
