import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { ZodResponse } from 'nestjs-zod';

import { Cookies } from '@/common/decorators/cookies.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BaseResponse } from '@/common/dtos';
import { Log } from '@/common/log/log.decorator';
import type { RequestUser } from '@/common/types';
import { COOKIES_MAPPING } from '@/domain/cookies';

import {
  ChangePasswordBody,
  CreateUserBody,
  RecoverPasswordBody,
  ResetPasswordBody,
  SignInWithEmailBody,
  SignInWithEmailResponse,
} from './auth.dtos';
import { ChangePasswordUseCase } from './use-cases/change-password.use-case';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { RecoverPasswordUseCase } from './use-cases/recover-password.use-case';
import { ResetPasswordUseCase } from './use-cases/reset-password.use-case';
import { SignInWithEmailUseCase } from './use-cases/sign-in-with-email.use-case';

@Controller()
export class AuthController {
  constructor(
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly recoverPasswordUseCase: RecoverPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly signInUseCase: SignInWithEmailUseCase,
  ) {}

  @Post('login')
  @Public()
  @Log('sign_in')
  @ApiOperation({ summary: 'Inicia a sessão do usuário ou paciente' })
  @ZodResponse({ type: SignInWithEmailResponse, status: 200 })
  async login(
    @Body() body: SignInWithEmailBody,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SignInWithEmailResponse> {
    const data = await this.signInUseCase.execute({ response, ...body });

    return {
      success: true,
      message: 'Login realizado com sucesso.',
      data,
    };
  }

  @Post('register/user')
  @Public()
  @Log('register_user')
  @ApiOperation({ summary: 'Registra um novo usuário via convite' })
  @ZodResponse({ type: BaseResponse, status: 201 })
  async registerUser(
    @Body() body: CreateUserBody,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    await this.createUserUseCase.execute({ response, ...body });

    return {
      success: true,
      message: 'Sua conta foi cadastrada com sucesso.',
    };
  }

  @Post('recover-password')
  @Public()
  @Log('recover_password')
  @ApiOperation({ summary: 'Solicita recuperação de senha' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async recoverPassword(
    @Body() body: RecoverPasswordBody,
  ): Promise<BaseResponse> {
    await this.recoverPasswordUseCase.execute(body);

    return {
      success: true,
      message:
        'O link para redefinição de senha foi enviado ao e-mail informado.',
    };
  }

  @Post('reset-password')
  @Public()
  @Log('reset_password')
  @ApiOperation({ summary: 'Solicita redefinição de senha' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async resetPassword(
    @Body() body: ResetPasswordBody,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    await this.resetPasswordUseCase.execute({ response, ...body });

    return {
      success: true,
      message: 'Senha atualizada com sucesso.',
    };
  }

  @Post('change-password')
  @Roles(['all'])
  @Log('change_password')
  @ApiOperation({
    summary: 'Altera a senha do usuário ou paciente autenticado',
  })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async changePassword(
    @User() user: RequestUser,
    @Body() body: ChangePasswordBody,
  ): Promise<BaseResponse> {
    await this.changePasswordUseCase.execute({ user, ...body });

    return {
      success: true,
      message: 'Senha alterada com sucesso.',
    };
  }

  @Post('logout')
  @Public()
  @Log('logout')
  @ApiOperation({ summary: 'Encerra a sessão do usuário ou paciente' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async logout(
    @Cookies(COOKIES_MAPPING.session) sessionToken: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    await this.logoutUseCase.execute({ response, sessionToken });

    return {
      success: true,
      message: 'Logout realizado com sucesso.',
    };
  }
}
