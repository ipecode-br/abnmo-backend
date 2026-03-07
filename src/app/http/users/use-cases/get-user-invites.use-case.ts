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

import { Token } from '@/domain/entities/token';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import type { UserInvitesOrderBy } from '@/domain/enums/users';
import type { UserInviteResponse } from '@/domain/schemas/users/responses';

import type { GetUserInvitesQuery } from '../users.dtos';

interface GetUserInvitesUseCaseInput {
  query: GetUserInvitesQuery;
}

interface GetUserInvitesUseCaseOutput {
  invites: UserInviteResponse[];
  total: number;
}

@Injectable()
export class GetUserInvitesUseCase {
  constructor(
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
  ) {}

  async execute({
    query,
  }: GetUserInvitesUseCaseInput): Promise<GetUserInvitesUseCaseOutput> {
    const { search, page, perPage } = query;
    const startDate = query.startDate ? new Date(query.startDate) : null;
    const endDate = query.endDate ? new Date(query.endDate) : null;

    const ORDER_BY_MAPPING: Record<UserInvitesOrderBy, keyof Token> = {
      email: 'email',
      date: 'createdAt',
    };

    const where: FindOptionsWhere<Token> = {
      type: AUTH_TOKENS_MAPPING.invite_user,
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

    if (search) {
      where.email = ILike(`%${search}%`);
    }

    const total = await this.tokensRepository.count({ where });

    const orderBy = ORDER_BY_MAPPING[query.orderBy];
    const order = { [orderBy]: query.order };

    const invites = await this.tokensRepository.find({
      select: {
        id: true,
        email: true,
        expiresAt: true,
        createdAt: true,
      },
      skip: (page - 1) * perPage,
      take: perPage,
      order,
      where,
    });

    return { invites, total };
  }
}
