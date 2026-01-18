import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';

import type { AuthUserDto } from '../../auth/auth.dtos';
import type { CreateUserInviteDto } from '../users.dtos';

interface CreateUserInviteUseCaseInput {
  user: AuthUserDto;
  createUserInviteDto: CreateUserInviteDto;
}

@Injectable()
export class CreateUserInviteUseCase {
  private readonly logger = new Logger(CreateUserInviteUseCase.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly createTokenUseCase: CreateTokenUseCase,
  ) {}

  async execute({
    user,
    createUserInviteDto,
  }: CreateUserInviteUseCaseInput): Promise<void> {
    const { email, role } = createUserInviteDto;

    const [existingUser, existingInviteUserToken] = await Promise.all([
      this.usersRepository.findOne({ where: { email }, select: { id: true } }),
      this.tokensRepository.findOne({ where: { email } }),
    ]);

    if (existingUser) {
      throw new ConflictException('Este e-mail já está cadastrado no sistema.');
    }

    const existingTokenExpiryDate = existingInviteUserToken?.expires_at;

    if (existingTokenExpiryDate && existingTokenExpiryDate > new Date()) {
      throw new ConflictException(
        'Já existe um convite ativo para este e-mail.',
      );
    }

    const [{ token: inviteUserToken, expiresAt }] = await Promise.all([
      this.createTokenUseCase.execute({
        type: AUTH_TOKENS_MAPPING.invite_user,
        payload: { role },
      }),
      // Delete all tokens for this email before creating a new one
      this.tokensRepository.delete({ email }),
    ]);

    const newInviteUserToken = this.tokensRepository.create({
      type: AUTH_TOKENS_MAPPING.invite_user,
      token: inviteUserToken,
      expires_at: expiresAt,
      email,
    });

    await this.tokensRepository.save(newInviteUserToken);

    // TODO: send email with register user URL including invite token

    this.logger.log(
      { id: newInviteUserToken.id, email, role, createdBy: user.id },
      'Invite user token created successfully',
    );
  }
}
