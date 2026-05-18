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
import type { PatientRequirementStatus } from '@/domain/enums/patient-requirements';
import type { PatientRequirementByPatientId } from '@/domain/schemas/patient-requirement/responses';

interface GetPatientRequirementsByPatientIdUseCaseInput {
  patientId: string;
  page: number;
  perPage: number;
  status?: PatientRequirementStatus;
  startDate?: string;
  endDate?: string;
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
    status,
    page,
    perPage,
    ...props
  }: GetPatientRequirementsByPatientIdUseCaseInput): Promise<GetPatientRequirementsByPatientIdUseCaseOutput> {
    const startDate = props.startDate ? new Date(props.startDate) : null;
    const endDate = props.endDate ? new Date(props.endDate) : null;

    const where: FindOptionsWhere<PatientRequirement> = {
      patientId,
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
