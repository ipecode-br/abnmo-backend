import { Body, Controller, Logger, Post, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';

import { COOKIES_MAPPER } from '@/domain/cookies';
import type { SignInWithEmailResponseSchema } from '@/domain/schemas/auth';
import { UtilsService } from '@/utils/utils.service';

import { CreateUserDto } from '../users/users.dtos';
import { UsersService } from '../users/users.service';
import { SignInWithEmailDto } from './auth.dtos';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

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
  ): Promise<SignInWithEmailResponseSchema> {
    const user = await this.usersService.create(createUserDto);

    // TODO: create and set a access_token cookie after registering the user

    this.logger.log(
      `Usuário registrado com sucesso: ${JSON.stringify({ id: user.id, email: user.email, timestamp: new Date() })}`,
    );

    return {
      success: true,
      message: 'Registro realizado com sucesso.',
    };
  }
}
