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
import { User } from '@/domain/entities/user';

interface ActivateUserUseCaseInput {
  id: string;
  user: RequestUser;
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
    can(user, 'activate:user');

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

    this.logger.log('User activated', { id });
  }
}
