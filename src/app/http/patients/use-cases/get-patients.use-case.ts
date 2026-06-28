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

import { User } from '@/domain/entities/user';
import type { QueryOrder } from '@/domain/enums/queries';
import type { UsersOrderBy, UserStatus } from '@/domain/enums/users';
import type { ListPatientResponse } from '@/domain/schemas/patients/responses';

interface GetPatientsUseCaseInput {
  page: number;
  perPage: number;
  search?: string;
  order?: QueryOrder;
  orderBy?: UsersOrderBy;
  status?: UserStatus;
  startDate?: string;
  endDate?: string;
}

interface GetPatientsUseCaseOutput {
  patients: ListPatientResponse[];
  total: number;
}

@Injectable()
export class GetPatientsUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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

    const ORDER_BY_MAPPING: Record<UsersOrderBy, keyof User> = {
      name: 'name',
      role: 'role',
      status: 'status',
      date: 'createdAt',
    };

    const where: FindOptionsWhere<User> = { role: 'patient' };

    if (search) {
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
        cpf: true,
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
        cpf: patient.cpf,
        status: patient.status,
        avatarUrl: patient.avatarUrl,
        createdAt: patient.createdAt,
      })),
      total,
    };
  }
}
