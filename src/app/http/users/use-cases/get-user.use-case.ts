import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { can } from '@/common/authorization/can';
import type { RequestUser } from '@/common/types';
import { User } from '@/domain/entities/user';
import { UserDetailsResponse } from '@/domain/schemas/users/responses';

interface GetUserUseCaseInput {
  id: string;
  user: RequestUser;
}

@Injectable()
export class GetUserUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async execute({
    id,
    user: requestUser,
  }: GetUserUseCaseInput): Promise<UserDetailsResponse> {
    can(requestUser, 'read:user', id);

    const foundUser = await this.usersRepository.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        features: true,
        status: true,
        specialty: true,
        registrationId: true,
        createdAt: true,
      },
    });

    if (!foundUser) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      avatarUrl: foundUser.avatarUrl,
      role: foundUser.role,
      features: foundUser.features,
      status: foundUser.status,
      specialty: foundUser.specialty,
      registrationId: foundUser.registrationId,
      createdAt: foundUser.createdAt,
    };
  }
}
