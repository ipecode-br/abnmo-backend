import {
  ConflictException,
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

interface ActivateUserUseCaseInput {
  id: string;
  user: AuthUser;
}

@Injectable()
@Log()
export class ActivateUserUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly logger: LogService,
  ) {}

  async execute({ id, user }: ActivateUserUseCaseInput): Promise<void> {
    if (user.role !== 'admin') {
      this.logger.log('Activate user failed: User does not have permission', {
        id,
      });
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

    this.logger.log('User activated successfully', { id });
  }
}
