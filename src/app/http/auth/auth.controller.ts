import {
  Body,
  Controller,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';

import { Cookies } from '@/common/decorators/cookies';
import { COOKIES_MAPPER } from '@/domain/cookies';
import type { SignInWithEmailResponseSchema } from '@/domain/schemas/auth';
import { UtilsService } from '@/utils/utils.service';

import { CreateUserDto } from '../users/users.dtos';
import { UsersService } from '../users/users.service';
import { SignInWithEmailDto } from './auth.dtos';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(
    private authService: AuthService,
    private utilsService: UtilsService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  @ApiBody({ type: SignInWithEmailDto })
  @ApiOperation({ summary: 'Login do usuário.' })
  @ApiResponse({ status: 201, description: 'Login realizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async signIn(
    @Res({ passthrough: true }) response: Response,
    @Body() body: SignInWithEmailDto,
  ): Promise<SignInWithEmailResponseSchema> {
    const { accessToken } = await this.authService.signIn(body);

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPER.access_token,
      value: accessToken,
    });

    return {
      success: true,
      message: 'Login realizado com sucesso.',
    };
  }

  @Post('register')
  @ApiBody({ type: CreateUserDto })
  @ApiOperation({ summary: 'Registro de um novo usuário.' })
  @ApiResponse({ status: 201, description: 'Registro realizado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 409, description: 'E-mail já registrado.' })
  async register(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SignInWithEmailResponseSchema> {
    const password = createUserDto.password;

    const user = await this.usersService.create(createUserDto);

    const { accessToken } = await this.authService.signIn({
      email: user.email,
      password,
      rememberMe: false,
    });

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPER.access_token,
      value: accessToken,
    });

    return {
      success: true,
      message: 'Registro realizado com sucesso.',
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout do usuário.' })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido.' })
  async logout(
    @Res({ passthrough: true }) response: Response,
    @Cookies('access_token') accessToken: string,
  ) {
    if (!accessToken) {
      throw new UnauthorizedException('Token de acesso ausente.');
    }

    await this.authService.logout(accessToken);

    this.utilsService.deleteCookie(response, COOKIES_MAPPER.access_token);

    return {
      success: true,
      message: 'Logout realizado com sucesso.',
    };
  }
}
