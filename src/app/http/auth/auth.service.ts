import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import { UserSchema } from '@/domain/schemas/user';
import { EnvService } from '@/env/env.service';

import type { CreateUserDto } from '../users/users.dtos';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import type { ChangePasswordDto, SignInWithEmailDto } from './auth.dtos';
import { TokensRepository } from './tokens.repository';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersService: UsersService,
    private readonly cryptographyService: CryptographyService,
    private readonly tokensRepository: TokensRepository,
    private readonly envService: EnvService,
  ) {}

  async registerUser(createUserDto: CreateUserDto): Promise<void> {
    await this.usersService.create(createUserDto);

    // TODO: create e-mail template builder
    // const subject = 'Verifique seu e-mail de cadastro';
    // const body = `<a href="link">Confirmar e-mail</a>`;

    // await this.mailService.sendEmail(createUserDto.email, subject, body);
  }

  async signInUser({
    email,
    password,
    rememberMe,
  }: SignInWithEmailDto): Promise<{ accessToken: string }> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(
        'Credenciais inválidas. Por favor, tente novamente.',
      );
    }

    const verifyPassword = await this.cryptographyService.compareHash(
      password,
      user.password,
    );

    if (!verifyPassword) {
      throw new UnauthorizedException(
        'Credenciais inválidas. Por favor, tente novamente.',
      );
    }

    const expiresIn = rememberMe ? '30d' : '12h';

    const accessToken = await this.cryptographyService.createToken(
      AUTH_TOKENS_MAPPING.access_token,
      { sub: user.id, role: user.role },
      { expiresIn },
    );

    const expiration = new Date();
    expiration.setHours(expiration.getHours() + (rememberMe ? 24 * 30 : 12));

    await this.tokensRepository.saveToken({
      user_id: user.id,
      email: null,
      token: accessToken,
      type: AUTH_TOKENS_MAPPING.access_token,
      expires_at: expiration,
    });

    this.logger.log({ id: user.id, email: user.email }, 'User logged in');

    return { accessToken };
  }

  async logout(token: string): Promise<void> {
    await this.tokensRepository.deleteToken(token);
  }

  async forgotPassword(email: string): Promise<{ passwordResetToken: string }> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      this.logger.warn(
        { email },
        'Attempt to recover password for non-registered email failed',
      );
      return { passwordResetToken: 'dummy_token' };
    }

    const payload = { sub: user.id, role: user.role };

    const passwordResetToken = await this.cryptographyService.createToken(
      AUTH_TOKENS_MAPPING.password_reset,
      payload,
      { expiresIn: '4h' },
    );

    const expiration = new Date();
    expiration.setHours(expiration.getHours() + 4);

    await this.tokensRepository.saveToken({
      user_id: user.id,
      email: null,
      token: passwordResetToken,
      type: AUTH_TOKENS_MAPPING.password_reset,
      expires_at: expiration,
    });

    const appUrl = this.envService.get('APP_URL');
    const resetUrl = `${appUrl}/conta/nova-senha?token=${passwordResetToken}`;

    this.logger.log(
      { id: user.id, email: user.email },
      'Reset password token generated successfully',
    );

    // Log da URL (substituindo o envio de email por enquanto)
    this.logger.log({ url: resetUrl }, 'Password reset URL');

    return { passwordResetToken };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ accessToken: string }> {
    const resetToken = await this.tokensRepository.findToken(token);

    if (
      !resetToken ||
      !resetToken.user_id ||
      resetToken.type !== AUTH_TOKENS_MAPPING.password_reset ||
      (resetToken.expires_at && resetToken.expires_at < new Date())
    ) {
      throw new UnauthorizedException(
        'Token de redefinição de senha inválido ou expirado.',
      );
    }

    const user = await this.usersRepository.findById(resetToken.user_id);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    const hashedPassword =
      await this.cryptographyService.createHash(newPassword);

    await this.usersRepository.updatePassword(user.id, hashedPassword);

    this.logger.log(
      { userId: user.id, email: user.email },
      'Password update successfully',
    );

    await this.tokensRepository.deleteToken(token);

    const { accessToken } = await this.signInUser({
      email: user.email,
      password: newPassword,
      rememberMe: false,
    });

    return { accessToken };
  }

  async changePassword(user: UserSchema, changePasswordDto: ChangePasswordDto) {
    const { password, newPassword } = changePasswordDto;

    const userFound = await this.usersRepository.findById(user.id);

    if (!userFound) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    const verifyPassword = await this.cryptographyService.compareHash(
      password,
      userFound.password,
    );

    if (!verifyPassword) {
      throw new UnauthorizedException(
        'Credenciais inválidas. Por favor, tente novamente.',
      );
    }

    const hashedPassword =
      await this.cryptographyService.createHash(newPassword);

    await this.usersRepository.updatePassword(user.id, hashedPassword);

    this.logger.log(
      { userId: user.id, email: user.email },
      'Password update successfully',
    );
  }
}
