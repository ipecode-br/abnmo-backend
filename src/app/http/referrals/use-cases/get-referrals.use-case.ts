import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  type FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  type Repository,
} from 'typeorm';

import { Referral } from '@/domain/entities/referral';
import type { PatientCondition } from '@/domain/enums/patients';
import type { QueryOrder } from '@/domain/enums/queries';
import type {
  ReferralsOrderBy,
  ReferralStatus,
} from '@/domain/enums/referrals';
import type { SpecialtyCategory } from '@/domain/enums/shared';

import type { AuthUserDto } from '../../auth/auth.dtos';

interface GetReferralsUseCaseInput {
  user: AuthUserDto;
  page: number;
  perPage: number;
  patientId?: string;
  status?: ReferralStatus;
  category?: SpecialtyCategory;
  condition?: PatientCondition;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  orderBy?: ReferralsOrderBy;
  order?: QueryOrder;
}

interface GetReferralsUseCaseOutput {
  referrals: Referral[];
  total: number;
}

@Injectable()
export class GetReferralsUseCase {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
  ) {}

  async execute({
    user,
    patientId,
    status,
    category,
    condition,
    search,
    page,
    perPage,
    limit,
    ...props
  }: GetReferralsUseCaseInput): Promise<GetReferralsUseCaseOutput> {
    const startDate = props.startDate ? new Date(props.startDate) : null;
    const endDate = props.endDate ? new Date(props.endDate) : null;

    const ORDER_BY_MAPPING: Record<ReferralsOrderBy, keyof Referral> = {
      date: 'date',
      patient: 'patient',
      status: 'status',
      category: 'category',
      condition: 'condition',
      professional: 'professional_name',
    };

    const where: FindOptionsWhere<Referral> = {};

    if (user.role === 'patient') {
      where.patient_id = user.id;
    }

    if (patientId) {
      where.patient_id = patientId;
    }

    if (startDate && !endDate) {
      where.date = MoreThanOrEqual(startDate);
    }

    if (endDate && !startDate) {
      where.date = LessThanOrEqual(endDate);
    }

    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (condition) {
      where.condition = condition;
    }

    if (search) {
      where.patient = { name: ILike(`%${search}%`) };
    }

    const total = await this.referralsRepository.count({ where });

    const orderBy = ORDER_BY_MAPPING[props.orderBy || 'date'];
    const order =
      orderBy === 'patient'
        ? { patient: { name: props.order } }
        : { [orderBy]: props.order };

    const referrals = await this.referralsRepository.find({
      select: {
        id: true,
        patient_id: true,
        date: true,
        status: true,
        category: true,
        condition: true,
        annotation: true,
        professional_name: true,
        created_at: true,
        updated_at: true,
        patient: { id: true, name: true, avatar_url: true },
      },
      relations: { patient: true },
      skip: (page - 1) * perPage,
      take: limit ?? perPage,
      order,
      where,
    });

    return { referrals, total };
  }
}
