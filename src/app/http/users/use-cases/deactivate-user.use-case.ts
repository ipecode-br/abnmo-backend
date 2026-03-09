import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { AuthUser } from '@/common/types';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';

interface DeactivateUserUseCaseInput {
  id: string;
  user: AuthUser;
}

@Injectable()
export class DeactivateUserUseCase {
  private readonly logger = new Logger(DeactivateUserUseCase.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
  ) {}

  async execute({ id, user }: DeactivateUserUseCaseInput): Promise<void> {
    if (user.role !== 'admin') {
      this.logger.log(
        { id, userId: user.id, userEmail: user.email },
        'Deactivate user failed: User does not have permission',
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

    this.logger.log(
      { id, userId: user.id, userEmail: user.email },
      'User deactivated successfully',
    );
  }
}
