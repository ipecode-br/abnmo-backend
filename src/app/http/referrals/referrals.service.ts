import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PatientsRepository } from '../patients/patients.repository';
import { CreateReferralDto } from './referrals.dtos';
import { ReferralsRepository } from './referrals.repository';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private readonly referralsRepository: ReferralsRepository,
    private readonly patientRepository: PatientsRepository,
  ) {}

  public async create(
    createReferralDto: CreateReferralDto,
    userId: string,
  ): Promise<void> {
    const { patient_id } = createReferralDto;

    const patient = await this.patientRepository.findById(patient_id);

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    await this.referralsRepository.create({
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
