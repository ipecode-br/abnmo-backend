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
import { Patient } from '@/domain/entities/patient';
import { Referral } from '@/domain/entities/referral';
import { User } from '@/domain/entities/user';
import type { PatientCondition } from '@/domain/enums/patients';
import type { SpecialtyCategory } from '@/domain/enums/shared';

interface CreateReferralUseCaseInput {
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
export class CreateReferralUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
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
  }: CreateReferralUseCaseInput): Promise<void> {
    this.logger.setEvent('create_referral');

    const patient = await this.patientsRepository.findOne({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const referralPayload: Partial<Referral> = {
      patientId: patientId,
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

      referralPayload.userId = specialist.id;
      referralPayload.professionalName = specialist.name;
      referralPayload.category = specialist.specialty;
    }

    if (!referralPayload.category) {
      throw new BadRequestException(
        'A categoria do atendimento é obrigatória.',
      );
    }

    const referral = this.referralsRepository.create(referralPayload);
    await this.referralsRepository.save(referral);

    this.logger.log('Referral created successfully', {
      id: referral.id,
      patientId,
    });
  }
}
