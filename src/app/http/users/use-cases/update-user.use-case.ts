import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
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

@Log()
@Injectable()
export class UpdateUserUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly logger: LogService,
  ) {}

  async execute({
    id,
    user,
    name,
    specialty,
    registrationId,
  }: UpdateUserUseCaseInput): Promise<void> {
    this.logger.setEvent('update_user');

    if (user.role !== 'admin' && user.id !== id) {
      this.logger.warn(
        'Update user failed: User does not have permission to update this user',
        {
          id,
        },
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

    this.logger.log('User updated successfully', {
      id,
      email: userToUpdate.email,
    });
  }
}
