import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { User } from '@/domain/entities/user';
import { UserRole } from '@/domain/enums/users';
import { EnvService } from '@/env/env.service';

import { CreateSessionUseCase } from './create-session.use-case';

interface SignInWithEmailUseCaseInput {
  email: string;
  password: string;
  keepLoggedIn: boolean;
  response: Response;
}

interface SignInWithEmailUseCaseOutput {
  role: UserRole;
}

@Injectable()
@Log()
export class SignInWithEmailUseCase {
  isTestMode: boolean = false;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly createSessionUseCase: CreateSessionUseCase,
    private readonly cryptographyService: CryptographyService,
    private readonly envService: EnvService,
    private readonly logger: LogService,
  ) {
    this.isTestMode = envService.get('NODE_ENV') === 'test';
  }

  async execute({
    email,
    password,
    keepLoggedIn,
    response,
  }: SignInWithEmailUseCaseInput): Promise<SignInWithEmailUseCaseOutput> {
    const user = await this.usersRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        status: true,
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException(
        'Credenciais inválidas. Por favor, tente novamente.',
      );
    }

    const passwordMatches = await this.cryptographyService.compareHash(
      password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Credenciais inválidas. Por favor, tente novamente.',
      );
    }

    if (user.status === 'inactive') {
      throw new ForbiddenException(
        'Permissão de acesso negada. Sua conta está inativa.',
      );
    }

    const role = user.role;

    if (role === 'patient' && !this.isTestMode) {
      throw new UnauthorizedException(
        'O sistema ainda não está pronto para pacientes.',
      );
    }

    await this.createSessionUseCase.execute({
      user: { id: user.id, email, role },
      keepLoggedIn,
      response,
    });

    this.logger.log('Signed in with e-mail', {
      id: user.id,
      email,
      role,
      keepLoggedIn,
    });

    return { role };
  }
}
