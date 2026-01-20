import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';

import { AuthUser } from '@/common/decorators/auth-user.decorator';
import { Cookies } from '@/common/decorators/cookies.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { BaseResponse } from '@/common/dtos';
import { COOKIES_MAPPING } from '@/domain/cookies';

import {
  AuthUserDto,
  ChangePasswordDto,
  RecoverPasswordDto,
  RegisterPatientDto,
  RegisterUserDto,
  ResetPasswordDto,
  SignInWithEmailDto,
} from './auth.dtos';
import { ChangePasswordUseCase } from './use-cases/change-password.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { RecoverPasswordUseCase } from './use-cases/recover-password.use-case';
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
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Inicia a sessão do usuário ou paciente' })
  @ApiResponse({ type: BaseResponse })
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

  @Public()
  @Post('register/patient')
  @ApiOperation({ summary: 'Registra um novo paciente' })
  @ApiResponse({ type: BaseResponse })
  async registerPatient(
    @Body() registerPatientDto: RegisterPatientDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    await this.registerPatientUseCase.execute({ registerPatientDto, response });

    return {
      success: true,
      message: 'Sua conta foi registrada com sucesso.',
    };
  }

  @Public()
  @Post('register/user')
  @ApiOperation({ summary: 'Registro um novo usuário via convite' })
  @ApiResponse({ type: BaseResponse })
  async registerUser(
    @Body() registerUserDto: RegisterUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<BaseResponse> {
    await this.registerUserUseCase.execute({ registerUserDto, response });

    return {
      success: true,
      message: 'Sua conta foi registrada com sucesso.',
    };
  }

  @Public()
  @Post('recover-password')
  @ApiOperation({ summary: 'Solicita recuperação de senha' })
  @ApiResponse({ type: BaseResponse })
  async recoverPassword(
    @Body() recoverPasswordDto: RecoverPasswordDto,
  ): Promise<BaseResponse> {
    await this.recoverPasswordUseCase.execute({ recoverPasswordDto });

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
    await this.resetPasswordUseCase.execute({ resetPasswordDto, response });

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
    @AuthUser() user: AuthUserDto,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<BaseResponse> {
    await this.changePasswordUseCase.execute({ user, changePasswordDto });

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
