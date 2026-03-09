import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Logger } from '@/common/log/logger.decorator';
import { AppLogger } from '@/common/log/logger.service';
import type { AuthUser } from '@/common/types';
import { Appointment } from '@/domain/entities/appointment';
import { Patient } from '@/domain/entities/patient';
import { User } from '@/domain/entities/user';
import type { PatientCondition } from '@/domain/enums/patients';
import type { SpecialtyCategory } from '@/domain/enums/shared';

interface CreateAppointmentUseCaseInput {
  user: AuthUser;
  patientId: string;
  date: Date;
  condition: PatientCondition;
  annotation: string | null;
  professionalName: string | null;
  category?: SpecialtyCategory;
}

@Logger()
@Injectable()
export class CreateAppointmentUseCase {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly logger: AppLogger,
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
    this.logger.setEvent('create_appointment');

    const patient = await this.patientsRepository.findOne({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const appointmentPayload: Partial<Appointment> = {
      patientId,
      date,
      category,
      condition,
      professionalName,
      annotation,
      status: 'scheduled',
      createdBy: user.id,
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

      appointmentPayload.userId = specialist.id;
      appointmentPayload.professionalName = specialist.name;
      appointmentPayload.category = specialist.specialty;
    }

    if (!appointmentPayload.category) {
      throw new BadRequestException(
        'A categoria do atendimento é obrigatória.',
      );
    }

    const appointment = this.appointmentsRepository.create(appointmentPayload);
    await this.appointmentsRepository.save(appointment);

    this.logger.log('Appointment created successfully', {
      id: appointment.id,
      patientId,
    });
  }
}
