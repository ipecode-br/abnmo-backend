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
import type { UserRole, UsersOrderBy, UserStatus } from '@/domain/enums/users';
import type { UserResponse } from '@/domain/schemas/users/responses';

interface GetUsersUseCaseInput {
  page: number;
  perPage: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  startDate?: string;
  endDate?: string;
  order?: QueryOrder;
  orderBy?: UsersOrderBy;
}

interface GetUsersUseCaseOutput {
  users: UserResponse[];
  total: number;
}

@Injectable()
export class GetUsersUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async execute({
    search,
    role,
    status,
    page,
    perPage,
    ...props
  }: GetUsersUseCaseInput): Promise<GetUsersUseCaseOutput> {
    const startDate = props.startDate ? new Date(props.startDate) : null;
    const endDate = props.endDate ? new Date(props.endDate) : null;

    const ORDER_BY_MAPPING: Record<UsersOrderBy, keyof User> = {
      name: 'name',
      role: 'role',
      status: 'status',
      date: 'createdAt',
    };

    const where: FindOptionsWhere<User> = {};

    if (startDate && !endDate) {
      where.createdAt = MoreThanOrEqual(startDate);
    }

    if (endDate && !startDate) {
      where.createdAt = LessThanOrEqual(endDate);
    }

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.name = ILike(`%${search}%`);
    }

    const total = await this.usersRepository.count({ where });

    const orderBy = ORDER_BY_MAPPING[props.orderBy || 'name'];

    const users = await this.usersRepository.find({
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        status: true,
        role: true,
        specialty: true,
        registrationId: true,
        updatedAt: true,
        createdAt: true,
      },
      order: { [orderBy]: props.order },
      skip: (page - 1) * perPage,
      take: perPage,
      where,
    });

    return { users, total };
  }
}
