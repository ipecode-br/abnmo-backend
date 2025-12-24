import {
  Body,
  Controller,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';

import { Cookies } from '@/common/decorators/cookies.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { COOKIES_MAPPING } from '@/domain/cookies';
import type { BaseResponse } from '@/domain/schemas/base';
import { UtilsService } from '@/utils/utils.service';

import {
  RecoverPasswordDto,
  RegisterPatientDto,
  RegisterUserDto,
  ResetPasswordDto,
  SignInWithEmailDto,
} from './auth.dtos';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { RecoverPasswordUseCase } from './use-cases/recover-password.use-case';
import { RegisterPatientUseCase } from './use-cases/register-patient.use-case';
import { RegisterUserUseCase } from './use-cases/register-user.use-case';
import { ResetPasswordUseCase } from './use-cases/reset-password.use-case';
import { SignInWithEmailUseCase } from './use-cases/sign-in-with-email.use-case';

@Public()
@Controller()
export class AuthController {
  constructor(
    private utilsService: UtilsService,
    private signInUseCase: SignInWithEmailUseCase,
    private logoutUseCase: LogoutUseCase,
    private recoverPasswordUseCase: RecoverPasswordUseCase,
    private resetPasswordUseCase: ResetPasswordUseCase,
    private registerPatientUseCase: RegisterPatientUseCase,
    private registerUserUseCase: RegisterUserUseCase,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login de usuário ou paciente' })
  async login(
    @Body() signInWithEmailDto: SignInWithEmailDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    const TWELVE_HOURS_IN_MS = 1000 * 60 * 60 * 12;

    const { accessToken } = await this.signInUseCase.execute({
      signInWithEmailDto,
    });

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPING.access_token,
      value: accessToken,
      maxAge: signInWithEmailDto.keep_logged_in
        ? TWELVE_HOURS_IN_MS * 60
        : TWELVE_HOURS_IN_MS,
    });

    return {
      success: true,
      message: 'Login realizado com sucesso.',
    };
  }

  @Post('register/patient')
  @ApiOperation({ summary: 'Registro de novo paciente' })
  async registerPatient(
    @Body() registerPatientDto: RegisterPatientDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    const TWELVE_HOURS_IN_MS = 1000 * 60 * 60 * 12;

    const { accessToken } = await this.registerPatientUseCase.execute({
      registerPatientDto,
    });

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPING.access_token,
      value: accessToken,
      maxAge: TWELVE_HOURS_IN_MS,
    });

    return {
      success: true,
      message: 'Conta de paciente registrada com sucesso.',
    };
  }

  @Post('register/user')
  @ApiOperation({ summary: 'Registro de novo usuário via convite' })
  async registerUser(
    @Body() registerUserDto: RegisterUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    const TWELVE_HOURS_IN_MS = 1000 * 60 * 60 * 12;

    const { accessToken } = await this.registerUserUseCase.execute({
      registerUserDto,
    });

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPING.access_token,
      value: accessToken,
      maxAge: TWELVE_HOURS_IN_MS,
    });

    return {
      success: true,
      message: 'Conta de usuário registrada com sucesso.',
    };
  }

  @Post('recover-password')
  @ApiOperation({ summary: 'Recuperação de senha' })
  async recoverPassword(
    @Body() recoverPasswordDto: RecoverPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    const { resetToken } = await this.recoverPasswordUseCase.execute({
      recoverPasswordDto,
    });

    const FOUR_HOURS_IN_MS = 1000 * 60 * 60 * 4;

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPING.password_reset,
      maxAge: FOUR_HOURS_IN_MS,
      value: resetToken,
    });

    return {
      success: true,
      message:
        'O link para redefinição de senha foi enviado ao e-mail solicitado.',
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Redefinição de senha' })
  async resetPassword(
    @Cookies(COOKIES_MAPPING.password_reset) token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    if (!token) {
      throw new UnauthorizedException('Token de redefinição de senha ausente.');
    }

    const TWELVE_HOURS_IN_MS = 1000 * 60 * 60 * 12;

    const { accessToken } = await this.resetPasswordUseCase.execute({
      resetPasswordDto,
      token,
    });

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPING.access_token,
      maxAge: TWELVE_HOURS_IN_MS,
      value: accessToken,
    });

    return {
      success: true,
      message: 'Senha atualizada com sucesso.',
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout' })
  async logout(
    @Cookies('access_token') accessToken: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    if (!accessToken) {
      throw new UnauthorizedException('Token de acesso ausente.');
    }

    await this.logoutUseCase.execute({ token: accessToken });

    this.utilsService.deleteCookie(response, COOKIES_MAPPING.access_token);

    return {
      success: true,
      message: 'Logout realizado com sucesso.',
    };
  }
}
