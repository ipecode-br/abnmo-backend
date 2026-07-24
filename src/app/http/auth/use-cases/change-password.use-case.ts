import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { User } from '@/domain/entities/user';

import { CreateSessionUseCase } from './create-session.use-case';
import { ExpireSessionUseCase } from './expire-session.use-case';

interface ChangePasswordUseCaseInput {
  user: RequestUser;
  password: string;
  newPassword: string;
  response: Response;
}

@Injectable()
@Log()
export class ChangePasswordUseCase {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly cryptographyService: CryptographyService,
    private readonly expireSessionUseCase: ExpireSessionUseCase,
    private readonly createSessionUseCase: CreateSessionUseCase,
    private readonly logger: LogService,
  ) {}

  async execute({
    user,
    password,
    newPassword,
    response,
  }: ChangePasswordUseCaseInput): Promise<void> {
    const { id } = user;

    const userToUpdate = await this.usersRepository.findOne({ where: { id } });

    if (!userToUpdate) {
      throw new NotFoundException('Usuário não encontrado.', {
        cause: `User ID <${id}> not found`,
      });
    }

    const passwordMatches = await this.cryptographyService.compareHash(
      password,
      userToUpdate.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Senha atual inválida.');
    }

    if (password === newPassword) {
      throw new BadRequestException(
        'A nova senha deve ser diferente da senha atual.',
      );
    }

    const passwordHash = await this.cryptographyService.createHash(newPassword);

    await this.usersRepository.update({ id }, { password: passwordHash });

    await this.expireSessionUseCase.execute({ userId: userToUpdate.id });

    await this.createSessionUseCase.execute({
      user: {
        id: user.id,
        email: userToUpdate.email,
        role: user.role,
        features: user.features,
      },
      keepLoggedIn: false,
      response,
    });

    this.logger.log('Password changed');
  }
}
