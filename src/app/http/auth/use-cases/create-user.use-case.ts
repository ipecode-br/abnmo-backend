import {
  ConflictException,
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
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import type { SpecialtyCategory } from '@/domain/enums/shared';
import { TOKENS } from '@/domain/enums/tokens';
import type { InviteUserPayload } from '@/domain/schemas/tokens';

import { CreateSessionUseCase } from './create-session.use-case';

interface CreateUserUseCaseInput {
  name: string;
  password: string;
  inviteToken: string;
  specialty?: SpecialtyCategory | null;
  registrationId?: string | null;
  response: Response;
}

@Injectable()
@Log()
export class CreateUserUseCase {
  constructor(
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly createSessionUseCase: CreateSessionUseCase,
    private readonly cryptographyService: CryptographyService,
    private readonly logger: LogService,
  ) {}

  async execute({
    name,
    password,
    specialty,
    registrationId,
    inviteToken,
    response,
  }: CreateUserUseCaseInput): Promise<void> {
    const token = await this.tokensRepository.findOne({
      where: { token: inviteToken },
    });

    if (!token) {
      throw new NotFoundException('Token de convite não encontrado.', {
        cause: `Invite token <${inviteToken}> not found`,
      });
    }

    const email = token.email;
    const isExpired = token.expiresAt && token.expiresAt < new Date();

    if (!email || token.type !== TOKENS.inviteUser || isExpired) {
      await this.tokensRepository.delete({ token: inviteToken });
      throw new UnauthorizedException('Token de convite inválido ou expirado.');
    }

    const payload =
      await this.cryptographyService.verifyToken<InviteUserPayload>(
        token.token,
      );

    if (!payload) {
      throw new UnauthorizedException('Token de convite inválido ou expirado.');
    }

    const { role } = payload;

    const userWithSameEmail = await this.usersRepository.findOne({
      select: { id: true },
      where: { email },
    });

    if (userWithSameEmail) {
      throw new ConflictException(
        'Este e-mail já está cadastrado no sistema.',
        { cause: `User with e-mail <${email}> already exists` },
      );
    }

    const passwordHash = await this.cryptographyService.createHash(password);

    const user = this.usersRepository.create({
      name,
      email,
      password: passwordHash,
      role,
      specialty,
      registrationId,
    });
    await this.usersRepository.save(user);

    await this.tokensRepository.delete({ token: inviteToken });

    await this.createSessionUseCase.execute({
      user: { id: user.id, email, role },
      keepLoggedIn: false,
      response,
    });

    this.logger.log('User registered', { id: user.id, email, role });
  }
}
