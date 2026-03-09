import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Logger } from '@/common/log/logger.decorator';
import { AppLogger } from '@/common/log/logger.service';
import type { AuthUser } from '@/common/types';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';

interface DeactivateUserUseCaseInput {
  id: string;
  user: AuthUser;
}

@Logger()
@Injectable()
export class DeactivateUserUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly logger: AppLogger,
  ) {}

  async execute({ id, user }: DeactivateUserUseCaseInput): Promise<void> {
    this.logger.setEvent('update_user');

    if (user.role !== 'admin') {
      this.logger.warn(
        'Deactivate user failed: User does not have permission',
        { id },
      );
      throw new ForbiddenException(
        'Você não tem permissão para inativar usuários.',
      );
    }

    const userToDeactivate = await this.usersRepository.findOne({
      select: { id: true, status: true },
      where: { id },
    });

    if (!userToDeactivate) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (userToDeactivate.status === 'inactive') {
      throw new ConflictException('Este usuário já está inativo.');
    }

    await this.usersRepository.update({ id }, { status: 'inactive' });

    await this.tokensRepository.delete({ entityId: id });

    this.logger.log('User deactivated successfully', { id });
  }
}
