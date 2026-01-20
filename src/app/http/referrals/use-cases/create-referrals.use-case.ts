import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import { Referral } from '@/domain/entities/referral';

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

    const referral = await this.referralsRepository.save({
      ...createReferralDto,
      status: 'scheduled',
      created_by: user.id,
    });

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
