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
import type { QueryOrder } from '@/domain/enums/queries';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import type { UserInvitesOrderBy } from '@/domain/enums/users';
import type { UserInviteResponse } from '@/domain/schemas/users/responses';

interface GetUserInvitesUseCaseInput {
  page: number;
  perPage: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  order?: QueryOrder;
  orderBy?: UserInvitesOrderBy;
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
    search,
    page,
    perPage,
    ...props
  }: GetUserInvitesUseCaseInput): Promise<GetUserInvitesUseCaseOutput> {
    const startDate = props.startDate ? new Date(props.startDate) : null;
    const endDate = props.endDate ? new Date(props.endDate) : null;

    const ORDER_BY_MAPPING: Record<UserInvitesOrderBy, keyof Token> = {
      email: 'email',
      date: 'createdAt',
    };

    const where: FindOptionsWhere<Token> = {
      type: AUTH_TOKENS_MAPPING.inviteUser,
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

    const orderBy = ORDER_BY_MAPPING[props.orderBy || 'date'];

    const invites = await this.tokensRepository.find({
      select: {
        id: true,
        email: true,
        expiresAt: true,
        createdAt: true,
      },
      order: { [orderBy]: props.order },
      skip: (page - 1) * perPage,
      take: perPage,
      where,
    });

    return { invites, total };
  }
}
