import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import type { InviteUserTokenPayload } from '@/domain/schemas/tokens';
import { UtilsService } from '@/utils/utils.service';

import { RegisterUserDto } from '../auth.dtos';

interface RegisterUserUseCaseInput {
  registerUserDto: RegisterUserDto;
  response: Response;
}

@Injectable()
export class RegisterUserUseCase {
  private readonly logger = new Logger(RegisterUserUseCase.name);

  constructor(
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly cryptographyService: CryptographyService,
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly utilsService: UtilsService,
  ) {}

  async execute({
    registerUserDto,
    response,
  }: RegisterUserUseCaseInput): Promise<void> {
    const { invite_token: token, name } = registerUserDto;

    const inviteToken = await this.tokensRepository.findOne({
      where: { token },
    });

    if (!inviteToken) {
      throw new NotFoundException('Token de convite não encontrado.');
    }

    if (
      !inviteToken.email ||
      inviteToken.type !== AUTH_TOKENS_MAPPING.invite_user_token ||
      (inviteToken.expires_at && inviteToken.expires_at < new Date())
    ) {
      await this.tokensRepository.delete({ token });
      throw new UnauthorizedException('Token de convite inválido ou expirado.');
    }

    const payload =
      await this.cryptographyService.verifyToken<InviteUserTokenPayload>(token);

    if (!payload) {
      throw new UnauthorizedException('Token de convite inválido ou expirado.');
    }

    const { email } = inviteToken;
    const { role } = payload;

    const userWithSameEmail = await this.usersRepository.findOne({
      select: { id: true },
      where: { email },
    });

    if (userWithSameEmail) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const password = await this.cryptographyService.createHash(
      registerUserDto.password,
    );

    const user = this.usersRepository.create({ name, email, password, role });

    await this.usersRepository.save(user);

    this.logger.log(
      { id: user.id, email, role },
      'User registered successfully',
    );

    await this.tokensRepository.delete({ token });

    const { maxAge, token: accessToken } =
      await this.createTokenUseCase.execute({
        type: AUTH_TOKENS_MAPPING.access_token,
        payload: { sub: user.id, accountType: 'user' },
      });

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPING.access_token,
      value: accessToken,
      maxAge,
    });
  }
}
