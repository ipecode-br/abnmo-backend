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

import { can } from '@/common/authorization/can';
import type { RequestUser } from '@/common/types';
import { Token } from '@/domain/entities/token';
import type { QueryOrder } from '@/domain/enums/queries';
import { TOKENS } from '@/domain/enums/tokens';
import type { UserInvitesOrderBy } from '@/domain/enums/users';
import type { UserInviteResponse } from '@/domain/schemas/users/responses';

interface GetUserInvitesUseCaseInput {
  user: RequestUser;
  page: number;
  perPage: number;
  search?: string;
  startDate?: Date;
  endDate?: Date;
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
    user,
    startDate,
    endDate,
    ...props
  }: GetUserInvitesUseCaseInput): Promise<GetUserInvitesUseCaseOutput> {
    can(user, 'read:user-invite');

    const ORDER_BY_MAPPING: Record<UserInvitesOrderBy, keyof Token> = {
      email: 'email',
      date: 'createdAt',
    };
    const orderBy = ORDER_BY_MAPPING[props.orderBy || 'date'];

    const where: FindOptionsWhere<Token> = {
      type: TOKENS.inviteUser,
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

    const result = await this.tokensRepository.find({
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

    const invites = result.map((invite) => ({
      id: invite.id,
      email: invite.email,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    }));

    return { invites, total };
  }
}
