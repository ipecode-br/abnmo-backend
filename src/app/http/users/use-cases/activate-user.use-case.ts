import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/domain/entities/user';

import type { AuthUserDto } from '../../auth/auth.dtos';

interface ActivateUserUseCaseInput {
  id: string;
  user: AuthUserDto;
}

@Injectable()
export class ActivateUserUseCase {
  private readonly logger = new Logger(ActivateUserUseCase.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async execute({ id, user }: ActivateUserUseCaseInput): Promise<void> {
    if (user.role !== 'admin') {
      this.logger.log(
        { id, userId: user.id, userEmail: user.email },
        'Activate user failed: User does not have permission',
      );
      throw new ForbiddenException(
        'Você não tem permissão para ativar usuários.',
      );
    }

    const userToActivate = await this.usersRepository.findOne({
      select: { id: true, status: true },
      where: { id },
    });

    if (!userToActivate) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (userToActivate.status === 'active') {
      throw new ConflictException('Este usuário já está ativo.');
    }

    await this.usersRepository.update({ id }, { status: 'active' });

    this.logger.log(
      { id, userId: user.id, userEmail: user.email },
      'User activated successfully',
    );
  }
}
