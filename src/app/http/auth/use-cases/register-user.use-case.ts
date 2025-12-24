import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';

import { RegisterUserDto } from '../auth.dtos';

interface RegisterUserUseCaseRequest {
  registerUserDto: RegisterUserDto;
}

type RegisterUserUseCaseResponse = Promise<{ accessToken: string }>;

@Injectable()
export class RegisterUserUseCase {
  private readonly logger = new Logger(RegisterUserUseCase.name);

  constructor(
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly cryptographyService: CryptographyService,
  ) {}

  async execute({
    registerUserDto,
  }: RegisterUserUseCaseRequest): RegisterUserUseCaseResponse {
    const { invite_token: token, name } = registerUserDto;

    const inviteToken = await this.tokensRepository.findOne({
      where: { token },
    });

    if (
      !inviteToken ||
      inviteToken.type !== AUTH_TOKENS_MAPPING.invite_token ||
      (inviteToken.expires_at && inviteToken.expires_at < new Date())
    ) {
      throw new UnauthorizedException('Token de convite inválido ou expirado.');
    }

    const email = inviteToken.email;

    if (!email) {
      throw new UnauthorizedException('Token de convite inválido.');
    }

    const user = await this.usersRepository.findOne({
      select: { id: true },
      where: { email },
    });

    if (user) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const password = await this.cryptographyService.createHash(
      registerUserDto.password,
    );

    const newUser = this.usersRepository.create({ name, email, password });

    await this.usersRepository.save(newUser);

    this.logger.log(
      { userId: newUser.id, email, role: newUser.role },
      'User registered successfully',
    );

    await this.tokensRepository.delete({ token });

    const accessToken = await this.cryptographyService.createToken(
      AUTH_TOKENS_MAPPING.access_token,
      { sub: newUser.id, role: newUser.role },
      { expiresIn: '12h' },
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 12);

    await this.tokensRepository.save({
      type: AUTH_TOKENS_MAPPING.access_token,
      expires_at: expiresAt,
      entity_id: newUser.id,
      token: accessToken,
    });

    return { accessToken };
  }
}
