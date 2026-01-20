import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  type FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  type Repository,
} from 'typeorm';

import { Patient } from '@/domain/entities/patient';
import type { PatientOrderBy } from '@/domain/enums/patients';
import type { PatientResponse } from '@/domain/schemas/patients/responses';

import type { GetPatientsQuery } from '../patients.dtos';

interface GetPatientsUseCaseInput {
  query: GetPatientsQuery;
}

interface GetPatientsUseCaseOutput {
  patients: PatientResponse[];
  total: number;
}

@Injectable()
export class GetPatientsUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  async execute({
    query,
  }: GetPatientsUseCaseInput): Promise<GetPatientsUseCaseOutput> {
    const { search, order, orderBy, status, page, perPage } = query;
    const startDate = query.startDate ? new Date(query.startDate) : null;
    const endDate = query.endDate ? new Date(query.endDate) : null;

    const ORDER_BY_MAPPING: Record<PatientOrderBy, keyof Patient> = {
      name: 'name',
      email: 'email',
      status: 'status',
      date: 'created_at',
    };

    const where: FindOptionsWhere<Patient> = {
      status: status ?? Not('pending'),
    };

    if (search) {
      where.name = ILike(`%${search}%`);
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

    const total = await this.patientsRepository.count({ where });

    const patients = await this.patientsRepository.find({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        avatar_url: true,
        phone: true,
        created_at: true,
      },
      order: { [ORDER_BY_MAPPING[orderBy]]: order },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return { patients, total };
  }
}
