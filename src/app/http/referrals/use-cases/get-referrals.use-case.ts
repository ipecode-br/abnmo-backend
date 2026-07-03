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

import type { RequestUser } from '@/common/types';
import { Referral } from '@/domain/entities/referral';
import type { PatientCondition } from '@/domain/enums/patients';
import type { QueryOrder } from '@/domain/enums/queries';
import type {
  ReferralsOrderBy,
  ReferralStatus,
} from '@/domain/enums/referrals';
import type { SpecialtyCategory } from '@/domain/enums/shared';
import type { ReferralResponseSchema } from '@/domain/schemas/referrals/responses';

interface GetReferralsUseCaseInput {
  category?: SpecialtyCategory;
  condition?: PatientCondition;
  endDate?: string;
  limit?: number;
  order?: QueryOrder;
  orderBy?: ReferralsOrderBy;
  page: number;
  patientId?: string;
  perPage: number;
  search?: string;
  startDate?: string;
  status?: ReferralStatus;
  user: RequestUser;
}

interface GetReferralsUseCaseOutput {
  referrals: ReferralResponseSchema[];
  total: number;
}

@Injectable()
export class GetReferralsUseCase {
  constructor(
    @InjectRepository(Referral)
    private readonly referralsRepository: Repository<Referral>,
  ) {}

  async execute({
    category,
    condition,
    limit,
    page,
    patientId,
    perPage,
    search,
    status,
    user,
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
      professional: 'professionalName',
    };

    const where: FindOptionsWhere<Referral> = {};

    if (user.role === 'patient') {
      where.patient = { id: user.id };
    }

    if (patientId) {
      where.patient = { id: patientId };
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
        date: true,
        status: true,
        category: true,
        condition: true,
        annotation: true,
        professionalName: true,
        patient: { id: true, name: true, email: true, avatarUrl: true },
        specialist: { id: true, name: true, email: true, avatarUrl: true },
      },
      relations: { patient: true, specialist: true },
      skip: (page - 1) * perPage,
      take: limit ?? perPage,
      order,
      where,
    });

    return {
      referrals: referrals.map((referral) => ({
        id: referral.id,
        date: referral.date,
        status: referral.status,
        category: referral.category,
        condition: referral.condition,
        annotation: referral.annotation,
        professionalName: referral.professionalName,
        patient: {
          id: referral.patient.id,
          name: referral.patient.name,
          email: referral.patient.email,
          avatarUrl: referral.patient.avatarUrl,
        },
        specialist: referral.specialist
          ? {
              id: referral.specialist.id,
              name: referral.specialist.name,
              email: referral.specialist.email,
              avatarUrl: referral.specialist.avatarUrl,
            }
          : null,
      })),
      total,
    };
  }
}
