import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';

import { Cookies } from '@/common/decorators/cookies.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BaseResponse } from '@/common/dtos';
import type { AuthUser } from '@/common/types';
import { COOKIES_MAPPING } from '@/domain/cookies';

import {
  ChangePasswordDto,
  RecoverPasswordDto,
  RegisterPatientDto,
  RegisterUserDto,
  ResetPasswordDto,
  SignInWithEmailDto,
  SignInWithEmailResponse,
} from './auth.dtos';
import { ChangePasswordUseCase } from './use-cases/change-password.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { RecoverPasswordUseCase } from './use-cases/recover-password.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { RegisterPatientUseCase } from './use-cases/register-patient.use-case';
import { RegisterUserUseCase } from './use-cases/register-user.use-case';
import { ResetPasswordUseCase } from './use-cases/reset-password.use-case';
import { SignInWithEmailUseCase } from './use-cases/sign-in-with-email.use-case';

@Controller()
export class AuthController {
  constructor(
    private readonly signInUseCase: SignInWithEmailUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly recoverPasswordUseCase: RecoverPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly registerPatientUseCase: RegisterPatientUseCase,
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Inicia a sessão do usuário ou paciente' })
  @ApiResponse({ type: SignInWithEmailResponse })
  async login(
    @Body() signInWithEmailDto: SignInWithEmailDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SignInWithEmailResponse> {
    const { email, password, keepLoggedIn } = signInWithEmailDto;

    const { accountType } = await this.signInUseCase.execute({
      email,
      password,
      keepLoggedIn,
      response,
    });

    return {
      success: true,
      message: 'Login realizado com sucesso.',
      data: { accountType },
    };
  }

  @Public()
  @Post('refresh-token')
  @ApiOperation({ summary: 'Atualiza o token de acesso' })
  @ApiResponse({ type: BaseResponse })
  async refreshToken(
    @Cookies(COOKIES_MAPPING.refresh_token) refreshToken: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    await this.refreshTokenUseCase.execute({ refreshToken, response });

    return {
      success: true,
      message: 'Token atualizado com sucesso.',
    };
  }

  @Public()
  @Post('register/patient')
  @ApiOperation({ summary: 'Registra um novo paciente' })
  @ApiResponse({ type: BaseResponse })
  async registerPatient(
    @Body() registerPatientDto: RegisterPatientDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    const { name, email, password } = registerPatientDto;

    await this.registerPatientUseCase.execute({
      name,
      email,
      password,
      response,
    });

    return {
      success: true,
      message: 'Sua conta foi cadastrada com sucesso.',
    };
  }

  @Public()
  @Post('register/user')
  @ApiOperation({ summary: 'Registra um novo usuário via convite' })
  @ApiResponse({ type: BaseResponse })
  async registerUser(
    @Body() registerUserDto: RegisterUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    const { name, password, specialty, registrationId, inviteToken } =
      registerUserDto;

    await this.registerUserUseCase.execute({
      name,
      password,
      specialty,
      registrationId,
      inviteToken,
      response,
    });

    return {
      success: true,
      message: 'Sua conta foi cadastrada com sucesso.',
    };
  }

  @Public()
  @Post('recover-password')
  @ApiOperation({ summary: 'Solicita recuperação de senha' })
  @ApiResponse({ type: BaseResponse })
  async recoverPassword(
    @Body() recoverPasswordDto: RecoverPasswordDto,
  ): Promise<BaseResponse> {
    const { email } = recoverPasswordDto;

    await this.recoverPasswordUseCase.execute({ email });

    return {
      success: true,
      message:
        'O link para redefinição de senha foi enviado ao e-mail informado.',
    };
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Solicita redefinição de senha' })
  @ApiResponse({ type: BaseResponse })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    const { password, resetToken } = resetPasswordDto;

    await this.resetPasswordUseCase.execute({ password, resetToken, response });

    return {
      success: true,
      message: 'Senha atualizada com sucesso.',
    };
  }

  @Roles(['all'])
  @Post('change-password')
  @ApiOperation({
    summary: 'Altera a senha do usuário ou paciente autenticado',
  })
  @ApiResponse({ type: BaseResponse })
  async changePassword(
    @User() user: AuthUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<BaseResponse> {
    const { password, newPassword } = changePasswordDto;

    await this.changePasswordUseCase.execute({ user, password, newPassword });

    return {
      success: true,
      message: 'Senha alterada com sucesso.',
    };
  }

  @Roles(['all'])
  @Post('logout')
  @ApiOperation({ summary: 'Encerra a sessão do usuário ou paciente' })
  @ApiResponse({ type: BaseResponse })
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
