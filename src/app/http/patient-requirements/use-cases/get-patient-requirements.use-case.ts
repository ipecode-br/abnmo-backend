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

import { PatientRequirement } from '@/domain/entities/patient-requirement';
import type {
  PatientRequirementsOrderBy,
  PatientRequirementStatus,
} from '@/domain/enums/patient-requirements';
import type { QueryOrder } from '@/domain/enums/queries';
import type { PatientRequirementItem } from '@/domain/schemas/patient-requirement/responses';

interface GetPatientRequirementsUseCaseInput {
  search?: string;
  page: number;
  perPage: number;
  status?: PatientRequirementStatus;
  startDate?: string;
  endDate?: string;
  order?: QueryOrder;
  orderBy?: PatientRequirementsOrderBy;
}

interface GetPatientRequirementsUseCaseOutput {
  requirements: PatientRequirementItem[];
  total: number;
}

@Injectable()
export class GetPatientRequirementsUseCase {
  constructor(
    @InjectRepository(PatientRequirement)
    private readonly patientRequirementsRepository: Repository<PatientRequirement>,
  ) {}

  async execute({
    search,
    status,
    page,
    perPage,
    ...props
  }: GetPatientRequirementsUseCaseInput): Promise<GetPatientRequirementsUseCaseOutput> {
    const startDate = props.startDate ? new Date(props.startDate) : null;
    const endDate = props.endDate ? new Date(props.endDate) : null;

    const ORDER_BY_MAPPING: Record<
      PatientRequirementsOrderBy,
      keyof PatientRequirement
    > = {
      patient: 'patient',
      type: 'type',
      status: 'status',
      approvedAt: 'approvedAt',
      submittedAt: 'submittedAt',
      date: 'createdAt',
    };

    const where: FindOptionsWhere<PatientRequirement> = {};

    if (search) {
      where.title = ILike(`%${search}%`);
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    if (startDate && !endDate) {
      where.createdAt = MoreThanOrEqual(startDate);
    }

    if (endDate && !startDate) {
      where.createdAt = LessThanOrEqual(endDate);
    }

    const total = await this.patientRequirementsRepository.count({ where });

    const orderBy = ORDER_BY_MAPPING[props.orderBy || 'date'];
    const order =
      orderBy === 'patient'
        ? { patient: { name: props.order } }
        : { [orderBy]: props.order };

    const requirements = await this.patientRequirementsRepository.find({
      relations: { patient: true },
      select: { patient: { id: true, name: true, avatarUrl: true } },
      skip: (page - 1) * perPage,
      take: perPage,
      order,
      where,
    });

    return { requirements, total };
  }
}
