import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { AuthUser } from '@/common/types';
import { User } from '@/domain/entities/user';
import type { SpecialtyCategory } from '@/domain/enums/shared';

interface UpdateUserUseCaseInput {
  id: string;
  user: AuthUser;
  name: string;
  specialty?: SpecialtyCategory | null;
  registrationId?: string | null;
}

@Injectable()
export class UpdateUserUseCase {
  private readonly logger = new Logger(UpdateUserUseCase.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async execute({
    id,
    user,
    name,
    specialty,
    registrationId,
  }: UpdateUserUseCaseInput): Promise<void> {
    if (user.role !== 'admin' && user.id !== id) {
      this.logger.log(
        { id, userId: user.id, userEmail: user.email, userRole: user.role },
        'Update user failed: User does not have permission to update this user',
      );
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este usuário.',
      );
    }

    const userToUpdate = await this.usersRepository.findOne({ where: { id } });

    if (!userToUpdate) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (userToUpdate.status === 'inactive') {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar um usuário inativo.',
      );
    }

    await this.usersRepository.update(userToUpdate.id, {
      name,
      specialty,
      registrationId,
    });

    this.logger.log(
      {
        id,
        email: userToUpdate.email,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
      },
      'User updated successfully',
    );
  }
}
