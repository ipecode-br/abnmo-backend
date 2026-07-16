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

import { can } from '@/common/authorization/can';
import type { RequestUser } from '@/common/types';
import { User } from '@/domain/entities/user';
import { PatientsOrderBy } from '@/domain/enums/patients';
import type { QueryOrder } from '@/domain/enums/queries';
import type { UserStatus } from '@/domain/enums/users';
import type { PatientResponse } from '@/domain/schemas/patients/responses';

interface GetPatientsUseCaseInput {
  user: RequestUser;
  page: number;
  perPage: number;
  search?: string;
  order?: QueryOrder;
  orderBy?: PatientsOrderBy;
  status?: UserStatus;
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
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async execute({
    user,
    search,
    status,
    page,
    perPage,
    ...props
  }: GetPatientsUseCaseInput): Promise<GetPatientsUseCaseOutput> {
    can(user, 'read:patient:others');

    const ORDER_BY_MAPPING: Record<PatientsOrderBy, keyof User> = {
      name: 'name',
      email: 'email',
      status: 'status',
      date: 'createdAt',
    };

    const startDate = props.startDate ? new Date(props.startDate) : null;
    const endDate = props.endDate ? new Date(props.endDate) : null;

    const where: FindOptionsWhere<User> = {
      role: 'patient',
      status: Not('pending'),
    };

    if (status) {
      where.status = status;
    }

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

    const total = await this.usersRepository.count({ where });

    const orderBy = ORDER_BY_MAPPING[props.orderBy || 'name'];

    const result = await this.usersRepository.find({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
      },
      order: { [orderBy]: props.order },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      patients: result.map((patient) => ({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone || '',
        status: patient.status,
        avatarUrl: patient.avatarUrl,
        createdAt: patient.createdAt,
      })),
      total,
    };
  }
}
