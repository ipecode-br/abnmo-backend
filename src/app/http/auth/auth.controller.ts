import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';

import { Cookies } from '@/common/decorators/cookies.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { COOKIES_MAPPING } from '@/domain/cookies';
import type { BaseResponse } from '@/domain/schemas/base';

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
    private readonly signInUseCase: SignInWithEmailUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly recoverPasswordUseCase: RecoverPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly registerPatientUseCase: RegisterPatientUseCase,
    private readonly registerUserUseCase: RegisterUserUseCase,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login de usuário ou paciente' })
  async login(
    @Body() signInWithEmailDto: SignInWithEmailDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    await this.signInUseCase.execute({ signInWithEmailDto, response });

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
    await this.registerPatientUseCase.execute({ registerPatientDto, response });

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
    await this.registerUserUseCase.execute({ registerUserDto, response });

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
    await this.recoverPasswordUseCase.execute({ response, recoverPasswordDto });

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
    await this.resetPasswordUseCase.execute({
      resetPasswordDto,
      response,
      token,
    });

    return {
      success: true,
      message: 'Senha atualizada com sucesso.',
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout do usuário ou paciente' })
  async logout(
    @Cookies(COOKIES_MAPPING.refresh_token) refreshToken: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    await this.logoutUseCase.execute({ response, refreshToken });

    return {
      success: true,
      message: 'Logout realizado com sucesso.',
    };
  }
}
