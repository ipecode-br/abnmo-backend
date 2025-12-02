import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ReferralFieldType } from '@/domain/schemas/referral';
import { UserSchema } from '@/domain/schemas/user';
import { UtilsService } from '@/utils/utils.service';

import { PatientsRepository } from '../patients/patients.repository';
import { CreateReferralDto, GetReferralByPeriodDto } from './referrals.dtos';
import { ReferralsRepository } from './referrals.repository';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private readonly referralsRepository: ReferralsRepository,
    private readonly patientsRepository: PatientsRepository,
    private readonly utilsService: UtilsService,
  ) {}

  public async create(
    createReferralDto: CreateReferralDto,
    userId: string,
  ): Promise<void> {
    const { patient_id } = createReferralDto;

    const patient = await this.patientsRepository.findById(patient_id);

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

  async getReferralByPeriod<T>(
    filter: ReferralFieldType,
    query: GetReferralByPeriodDto,
  ): Promise<{ items: T[]; total: number }> {
    const { startDate, endDate } = this.utilsService.getDateRangeForPeriod(
      query.period,
    );

    return await this.referralsRepository.getReferralsByPeriod(
      filter,
      startDate,
      endDate,
      query,
    );
  }

  async cancel(id: string, user: UserSchema): Promise<void> {
    const referral = await this.referralsRepository.findById(id);

    if (!referral) {
      throw new NotFoundException('Encaminhamento não encontrado.');
    }

    if (referral.status === 'canceled') {
      throw new BadRequestException('Este encaminhamento já está cancelado.');
    }

    await this.referralsRepository.cancel(referral.id);

    this.logger.log(
      { id: referral.id, userId: user.id },
      'Referral canceled successfully.',
    );
  }
}
