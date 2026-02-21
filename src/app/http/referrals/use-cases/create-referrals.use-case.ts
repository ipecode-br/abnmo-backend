import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import { Referral } from '@/domain/entities/referral';
import { User } from '@/domain/entities/user';
import type { PatientCondition } from '@/domain/enums/patients';
import type { SpecialtyCategory } from '@/domain/enums/shared';

import type { AuthUserDto } from '../../auth/auth.dtos';

interface CreateReferralUseCaseInput {
  user: AuthUserDto;
  patientId: string;
  date: Date;
  condition: PatientCondition;
  annotation: string | null;
  professionalName: string | null;
  category?: SpecialtyCategory;
}

@Injectable()
export class CreateReferralUseCase {
  private readonly logger = new Logger(CreateReferralUseCase.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
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
  }: CreateReferralUseCaseInput): Promise<void> {
    const patient = await this.patientsRepository.findOne({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const referralPayload: Partial<Referral> = {
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

      referralPayload.user_id = specialist.id;
      referralPayload.professional_name = specialist.name;
      referralPayload.category = specialist.specialty;
    }

    if (!referralPayload.category) {
      throw new BadRequestException(
        'A categoria do atendimento é obrigatória.',
      );
    }

    const referral = this.referralsRepository.create(referralPayload);
    await this.referralsRepository.save(referral);

    this.logger.log(
      {
        id: referral.id,
        patientId,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
      },
      'Referral created successfully',
    );
  }
}
