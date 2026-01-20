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
import type { PatientRequirementsOrderBy } from '@/domain/enums/patient-requirements';
import type { PatientRequirementItem } from '@/domain/schemas/patient-requirement/responses';

import type { GetPatientRequirementsQuery } from '../patient-requirements.dtos';

interface GetPatientRequirementsUseCaseInput {
  query: GetPatientRequirementsQuery;
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
    query,
  }: GetPatientRequirementsUseCaseInput): Promise<GetPatientRequirementsUseCaseOutput> {
    const { search, status, page, perPage } = query;
    const startDate = query.startDate ? new Date(query.startDate) : null;
    const endDate = query.endDate ? new Date(query.endDate) : null;

    const ORDER_BY_MAPPING: Record<
      PatientRequirementsOrderBy,
      keyof PatientRequirement
    > = {
      patient: 'patient',
      type: 'type',
      status: 'status',
      approved_at: 'approved_at',
      submitted_at: 'submitted_at',
      date: 'created_at',
    };

    const where: FindOptionsWhere<PatientRequirement> = {};

    if (search) {
      where.title = ILike(`%${search}%`);
    }

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.created_at = Between(startDate, endDate);
    }

    if (startDate && !endDate) {
      where.created_at = MoreThanOrEqual(startDate);
    }

    if (endDate && !startDate) {
      where.created_at = LessThanOrEqual(endDate);
    }

    const total = await this.patientRequirementsRepository.count({ where });

    const orderBy = ORDER_BY_MAPPING[query.orderBy];
    const order =
      orderBy === 'patient'
        ? { patient: { name: query.order } }
        : { [orderBy]: query.order };

    const requirements = await this.patientRequirementsRepository.find({
      relations: { patient: true },
      select: { patient: { id: true, name: true, avatar_url: true } },
      skip: (page - 1) * perPage,
      take: perPage,
      order,
      where,
    });

    return { requirements, total };
  }
}
