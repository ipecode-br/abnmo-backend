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
import type { QueryOrder } from '@/domain/enums/queries';
import type { UserRole, UsersOrderBy, UserStatus } from '@/domain/enums/users';
import { UserResponse } from '@/domain/schemas/users/responses';

interface GetUsersUseCaseInput {
  user: RequestUser;
  page: number;
  perPage: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  startDate?: Date;
  endDate?: Date;
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
    user,
    ...props
  }: GetUsersUseCaseInput): Promise<GetUsersUseCaseOutput> {
    can(user, 'read:user:others');

    const ORDER_BY_MAPPING: Record<UsersOrderBy, keyof User> = {
      name: 'name',
      role: 'role',
      status: 'status',
      date: 'createdAt',
    };

    const startDate = props.startDate ? new Date(props.startDate) : null;
    const endDate = props.endDate ? new Date(props.endDate) : null;

    const where: FindOptionsWhere<User> = {
      role: Not('patient'),
    };

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

    const result = await this.usersRepository.find({
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        status: true,
        specialty: true,
        registrationId: true,
        createdAt: true,
      },
      order: { [orderBy]: props.order },
      skip: (page - 1) * perPage,
      take: perPage,
      where,
    });

    const users = result.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      specialty: user.specialty,
      registrationId: user.registrationId,
      createdAt: user.createdAt,
    }));

    return { users, total };
  }
}
