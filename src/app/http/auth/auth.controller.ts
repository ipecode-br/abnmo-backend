import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { Cookies } from '@/common/decorators/cookies';
import { Public } from '@/common/decorators/public.decorator';
import { COOKIES_MAPPER } from '@/domain/cookies';
import type {
  RecoverPasswordResponseSchema,
  SignInWithEmailResponseSchema,
} from '@/domain/schemas/auth';
import { UtilsService } from '@/utils/utils.service';

import { CreateUserDto } from '../users/users.dtos';
import {
  RecoverPasswordDto,
  ResetPasswordDto,
  SignInWithEmailDto,
} from './auth.dtos';
import { AuthService } from './auth.service';

@Public()
@Controller()
export class AuthController {
  constructor(
    private authService: AuthService,
    private utilsService: UtilsService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login do usuário' })
  async signIn(
    @Req() request: Request,
    @Body() signInWithEmailDto: SignInWithEmailDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SignInWithEmailResponseSchema> {
    const TWELVE_HOURS_IN_MS = 1000 * 60 * 60 * 12;

    const { accessToken } = await this.authService.signIn(signInWithEmailDto);

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPER.access_token,
      value: accessToken,
      origin: request.headers.origin,
      maxAge: signInWithEmailDto.rememberMe
        ? TWELVE_HOURS_IN_MS * 60
        : TWELVE_HOURS_IN_MS,
    });

    return {
      success: true,
      message: 'Login realizado com sucesso.',
    };
  }

  @Post('register')
  @ApiOperation({ summary: 'Registro de um novo usuário' })
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<SignInWithEmailResponseSchema> {
    await this.authService.register(createUserDto);

    return {
      success: true,
      message: 'Conta registrada com sucesso.',
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout do usuário' })
  async logout(
    @Req() request: Request,
    @Cookies('access_token') accessToken: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!accessToken) {
      throw new UnauthorizedException('Token de acesso ausente.');
    }

    await this.authService.logout(accessToken);

    this.utilsService.deleteCookie(
      response,
      COOKIES_MAPPER.access_token,
      request.headers.origin,
    );

    return {
      success: true,
      message: 'Logout realizado com sucesso.',
    };
  }

  @Post('reset-password')
  async resetPassword(
    @Req() request: Request,
    @Cookies(COOKIES_MAPPER.password_reset)
    passwordResetToken: string,
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const TWELVE_HOURS_IN_MS = 1000 * 60 * 60 * 12;

    if (!passwordResetToken) {
      throw new UnauthorizedException('Token de redefinição de senha ausente.');
    }

    const { accessToken } = await this.authService.resetPassword(
      passwordResetToken,
      resetPasswordDto.password,
    );

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPER.access_token,
      value: accessToken,
      origin: request.headers.origin,
      maxAge: TWELVE_HOURS_IN_MS,
    });

    return {
      success: true,
      message: 'Senha atualizada com sucesso.',
    };
  }

  @Post('recover-password')
  @ApiOperation({ summary: 'Recuperação de senha' })
  async recoverPassword(
    @Req() request: Request,
    @Body() recoverPasswordDto: RecoverPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<RecoverPasswordResponseSchema> {
    const { passwordResetToken } = await this.authService.forgotPassword(
      recoverPasswordDto.email,
    );

    const FOUR_HOURS_IN_MS = 1000 * 60 * 60 * 4;

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPER.password_reset,
      value: passwordResetToken,
      origin: request.headers.origin,
      maxAge: FOUR_HOURS_IN_MS,
    });

    return {
      success: true,
      message:
        'O link para redefinição de senha foi enviado ao e-mail solicitado.',
    };
  }
}
