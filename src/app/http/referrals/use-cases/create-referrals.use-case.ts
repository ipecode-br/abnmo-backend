import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import { Referral } from '@/domain/entities/referral';

import { CreateReferralDto } from '../referrals.dtos';

interface CreateReferralUseCaseRequest {
  createReferralDto: CreateReferralDto;
  userId: string;
}

type CreateReferralUseCaseResponse = Promise<void>;

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
    createReferralDto,
    userId,
  }: CreateReferralUseCaseRequest): CreateReferralUseCaseResponse {
    const { patient_id } = createReferralDto;

    const patient = await this.patientsRepository.findOne({
      where: { id: patient_id },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    await this.referralsRepository.save({
      ...createReferralDto,
      status: 'scheduled',
      referred_by: userId,
    });

    this.logger.log(
      { patientId: patient_id, referredBy: userId },
      'Referral created successfully',
    );
  }
}
