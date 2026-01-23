import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/domain/entities/user';
import type { UserResponse } from '@/domain/schemas/users/responses';

interface GetUserUseCaseInput {
  id: string;
}

interface GetUserUseCaseOutput {
  user: UserResponse;
}

@Injectable()
export class GetUserUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async execute({ id }: GetUserUseCaseInput): Promise<GetUserUseCaseOutput> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar_url: true,
        status: true,
        role: true,
        updated_at: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return { user };
  }
}
