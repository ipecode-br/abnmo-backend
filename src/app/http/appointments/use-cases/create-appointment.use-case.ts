import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { Appointment } from '@/domain/entities/appointment';
import { User } from '@/domain/entities/user';
import type { PatientCondition } from '@/domain/enums/patients';
import type { SpecialtyCategory } from '@/domain/enums/shared';

interface CreateAppointmentUseCaseInput {
  annotation: string | null;
  category?: SpecialtyCategory;
  condition: PatientCondition;
  date: Date;
  patientId: string;
  professionalName: string | null;
  user: RequestUser;
}

@Injectable()
@Log()
export class CreateAppointmentUseCase {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly logger: LogService,
  ) {}

  async execute({
    annotation,
    category,
    condition,
    date,
    patientId,
    professionalName,
    user,
  }: CreateAppointmentUseCaseInput): Promise<void> {
    const patient = await this.usersRepository.findOne({
      where: { id: patientId, role: 'patient' },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.', {
        cause: `Patient with ID <${patientId}> not found`,
      });
    }

    let finalCategory = category;
    let finalProfessionalName = professionalName;
    let specialistRef: { id: string } | undefined;

    if (user.role === 'specialist') {
      if (category || professionalName) {
        throw new BadRequestException(
          'Especialistas não devem informar categoria ou profissional.',
        );
      }

      const specialist = await this.usersRepository.findOne({
        select: { id: true, name: true, specialty: true },
        where: { id: user.id, role: 'specialist' },
      });

      if (!specialist || !specialist.specialty) {
        throw new NotFoundException('Especialista não encontrado.', {
          cause: `Specialist with ID <${user.id}> not found`,
        });
      }

      finalCategory = specialist.specialty;
      finalProfessionalName = specialist.name;
      specialistRef = { id: specialist.id };
    }

    if (!finalCategory) {
      throw new BadRequestException(
        'A categoria do atendimento é obrigatória.',
      );
    }

    const appointment = this.appointmentsRepository.create({
      annotation,
      category: finalCategory,
      condition,
      createdBy: user.id,
      date,
      patient: { id: patientId },
      professionalName: finalProfessionalName,
      specialist: specialistRef,
      status: 'scheduled',
    });
    await this.appointmentsRepository.save(appointment);

    this.logger.log('Appointment created', { id: appointment.id, patientId });
  }
}
