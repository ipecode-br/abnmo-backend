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
import type { PatientOrderBy, PatientStatus } from '@/domain/enums/patients';
import type { QueryOrder } from '@/domain/enums/queries';
import type { PatientResponse } from '@/domain/schemas/patients/responses';

interface GetPatientsUseCaseInput {
  page: number;
  perPage: number;
  search?: string;
  order?: QueryOrder;
  orderBy?: PatientOrderBy;
  status?: PatientStatus;
  startDate?: string;
  endDate?: string;
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
    search,
    status,
    page,
    perPage,
    ...props
  }: GetPatientsUseCaseInput): Promise<GetPatientsUseCaseOutput> {
    const startDate = props.startDate ? new Date(props.startDate) : null;
    const endDate = props.endDate ? new Date(props.endDate) : null;

    const ORDER_BY_MAPPING: Record<PatientOrderBy, keyof Patient> = {
      name: 'name',
      email: 'email',
      status: 'status',
      date: 'createdAt',
    };

    const where: FindOptionsWhere<Patient> = {
      status: status ?? Not('pending'),
    };

    if (search) {
      where.name = ILike(`%${search}%`);
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

    const total = await this.patientsRepository.count({ where });

    const orderBy = ORDER_BY_MAPPING[props.orderBy || 'name'];

    const patients = await this.patientsRepository.find({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        avatarUrl: true,
        phone: true,
        createdAt: true,
      },
      order: { [orderBy]: props.order },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return { patients, total };
  }
}
