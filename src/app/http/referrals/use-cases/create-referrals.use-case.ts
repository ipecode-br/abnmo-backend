import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import { Referral } from '@/domain/entities/referral';
import { User } from '@/domain/entities/user';

import type { AuthUserDto } from '../../auth/auth.dtos';
import { CreateReferralDto } from '../referrals.dtos';

interface CreateReferralUseCaseInput {
  user: AuthUserDto;
  createReferralDto: CreateReferralDto;
}

@Injectable()
export class CreateReferralUseCase {
  private readonly logger = new Logger(CreateReferralUseCase.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
  ) {}

  async execute({
    user,
    createReferralDto,
  }: CreateReferralUseCaseInput): Promise<void> {
    const { patient_id: patientId } = createReferralDto;

    const patient = await this.patientsRepository.findOne({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const referralPayload: Partial<Referral> = {
      ...createReferralDto,
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

      referralPayload.user_id = specialist.id;
      referralPayload.professional_name = specialist.name;
      referralPayload.category = specialist.specialty;
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
