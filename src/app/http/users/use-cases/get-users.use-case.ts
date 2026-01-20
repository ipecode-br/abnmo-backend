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
import type { UsersOrderBy } from '@/domain/enums/users';
import type { UserResponse } from '@/domain/schemas/users/responses';

import type { GetUsersQuery } from '../users.dtos';

interface GetUsersUseCaseInput {
  query: GetUsersQuery;
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
    query,
  }: GetUsersUseCaseInput): Promise<GetUsersUseCaseOutput> {
    const { search, role, status, page, perPage } = query;
    const startDate = query.startDate ? new Date(query.startDate) : null;
    const endDate = query.endDate ? new Date(query.endDate) : null;

    const ORDER_BY_MAPPING: Record<UsersOrderBy, keyof User> = {
      name: 'name',
      date: 'created_at',
      role: 'role',
      status: 'status',
    };

    const where: FindOptionsWhere<User> = {};

    if (startDate && !endDate) {
      where.created_at = MoreThanOrEqual(startDate);
    }

    if (endDate && !startDate) {
      where.created_at = LessThanOrEqual(endDate);
    }

    if (startDate && endDate) {
      where.created_at = Between(startDate, endDate);
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

    const orderBy = ORDER_BY_MAPPING[query.orderBy];
    const order = { [orderBy]: query.order };

    const users = await this.usersRepository.find({
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
        status: true,
        role: true,
      },
      skip: (page - 1) * perPage,
      take: perPage,
      order,
      where,
    });

    return { users, total };
  }
}
