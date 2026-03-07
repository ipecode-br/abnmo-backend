import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  type FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  type Repository,
} from 'typeorm';

import { PatientRequirement } from '@/domain/entities/patient-requirement';
import type { PatientRequirementByPatientId } from '@/domain/schemas/patient-requirement/responses';

import type { GetPatientRequirementsByPatientIdQuery } from '../patient-requirements.dtos';

interface GetPatientRequirementsByPatientIdUseCaseInput {
  patientId: string;
  query: GetPatientRequirementsByPatientIdQuery;
}

interface GetPatientRequirementsByPatientIdUseCaseOutput {
  requirements: PatientRequirementByPatientId[];
  total: number;
}

@Injectable()
export class GetPatientRequirementsByPatientIdUseCase {
  constructor(
    @InjectRepository(PatientRequirement)
    private readonly patientRequirementsRepository: Repository<PatientRequirement>,
  ) {}

  async execute({
    patientId,
    query,
  }: GetPatientRequirementsByPatientIdUseCaseInput): Promise<GetPatientRequirementsByPatientIdUseCaseOutput> {
    const { status, page, perPage } = query;
    const startDate = query.startDate ? new Date(query.startDate) : null;
    const endDate = query.endDate ? new Date(query.endDate) : null;

    const where: FindOptionsWhere<PatientRequirement> = {
      patientId: patientId,
    };

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

    const requirements = await this.patientRequirementsRepository.find({
      where,
      select: {
        id: true,
        type: true,
        title: true,
        status: true,
        submittedAt: true,
        approvedAt: true,
        declinedAt: true,
        createdAt: true,
      },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return { requirements, total };
  }
}
