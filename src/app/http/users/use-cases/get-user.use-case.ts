import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/domain/entities/user';
import { UserDetailsResponse } from '@/domain/schemas/users/responses';

interface GetUserUseCaseInput {
  id: string;
}

@Injectable()
export class GetUserUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async execute({ id }: GetUserUseCaseInput): Promise<UserDetailsResponse> {
    const user = await this.usersRepository.findOne({
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

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      features: user.features,
      status: user.status,
      specialty: user.specialty,
      registrationId: user.registrationId,
      createdAt: user.createdAt,
    };
  }
}
