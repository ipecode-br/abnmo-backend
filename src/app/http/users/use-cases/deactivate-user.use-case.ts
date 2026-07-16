import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { can } from '@/common/authorization/can';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';

interface DeactivateUserUseCaseInput {
  id: string;
  user: RequestUser;
}

@Injectable()
@Log()
export class DeactivateUserUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly logger: LogService,
  ) {}

  async execute({ id, user }: DeactivateUserUseCaseInput): Promise<void> {
    can(user, 'deactivate:user');

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

    await this.tokensRepository.delete({ userId: id });

    this.logger.log('User deactivated', { id });
  }
}
