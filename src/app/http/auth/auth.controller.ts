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

import { AuthUser } from '@/common/decorators/auth-user.decorator';
import { Cookies } from '@/common/decorators/cookies.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { COOKIES_MAPPING } from '@/domain/cookies';
import type { BaseResponse } from '@/domain/schemas/base';
import { UserSchema } from '@/domain/schemas/users';
import { UtilsService } from '@/utils/utils.service';

import { CreateUserDto } from '../users/users.dtos';
import {
  ChangePasswordDto,
  RecoverPasswordDto,
  ResetPasswordDto,
  SignInWithEmailDto,
} from './auth.dtos';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(
    private authService: AuthService,
    private utilsService: UtilsService,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login do usuário' })
  async signIn(
    @Req() request: Request,
    @Body() signInWithEmailDto: SignInWithEmailDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    const TWELVE_HOURS_IN_MS = 1000 * 60 * 60 * 12;

    const { accessToken } =
      await this.authService.signInUser(signInWithEmailDto);

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPING.access_token,
      value: accessToken,
      maxAge: signInWithEmailDto.rememberMe
        ? TWELVE_HOURS_IN_MS * 60
        : TWELVE_HOURS_IN_MS,
    });

    return {
      success: true,
      message: 'Login realizado com sucesso.',
    };
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registro de um novo usuário' })
  async register(@Body() createUserDto: CreateUserDto): Promise<BaseResponse> {
    await this.authService.registerUser(createUserDto);

    return {
      success: true,
      message: 'Conta registrada com sucesso.',
    };
  }

  @Public()
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

    this.utilsService.deleteCookie(response, COOKIES_MAPPING.access_token);

    return {
      success: true,
      message: 'Logout realizado com sucesso.',
    };
  }

  @Public()
  @Post('reset-password')
  async resetPassword(
    @Req() request: Request,
    @Cookies(COOKIES_MAPPING.password_reset)
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
      name: COOKIES_MAPPING.access_token,
      value: accessToken,
      maxAge: TWELVE_HOURS_IN_MS,
    });

    return {
      success: true,
      message: 'Senha atualizada com sucesso.',
    };
  }

  @Public()
  @Post('recover-password')
  @ApiOperation({ summary: 'Recuperação de senha' })
  async recoverPassword(
    @Req() request: Request,
    @Body() recoverPasswordDto: RecoverPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    const { passwordResetToken } = await this.authService.forgotPassword(
      recoverPasswordDto.email,
    );

    const FOUR_HOURS_IN_MS = 1000 * 60 * 60 * 4;

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPING.password_reset,
      value: passwordResetToken,
      maxAge: FOUR_HOURS_IN_MS,
    });

    return {
      success: true,
      message:
        'O link para redefinição de senha foi enviado ao e-mail solicitado.',
    };
  }

  @Post('change-password')
  @Roles(['nurse', 'manager', 'specialist', 'admin'])
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @AuthUser() user: UserSchema,
  ): Promise<BaseResponse> {
    await this.authService.changePassword(user, changePasswordDto);

    return {
      success: true,
      message: 'Senha atualizada com sucesso.',
    };
  }
}
