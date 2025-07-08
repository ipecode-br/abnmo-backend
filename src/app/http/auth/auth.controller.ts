import {
  Body,
  Controller,
  Logger,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';

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
    const { accessToken, refreshToken } = await this.authService.signIn(body);

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPER.access_token,
      value: accessToken,
    });

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPER.refresh_token,
      value: refreshToken,
    });

    return {
      success: true,
      message: 'Login realizado com sucesso.',
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Renova o access token a partir do refresh token' })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = (req.cookies?.[COOKIES_MAPPER.refresh_token] ??
      '') as string;
    if (!refreshToken)
      throw new UnauthorizedException('Refresh token ausente.');

    const newAccessToken =
      await this.authService.refreshAccessToken(refreshToken);

    this.utilsService.setCookie(res, {
      name: COOKIES_MAPPER.access_token,
      value: newAccessToken,
    });

    return {
      success: true,
      message: 'Novo access token gerado.',
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
    const user = await this.usersService.create(createUserDto);

    const { accessToken, refreshToken } = await this.authService.signIn({
      email: user.email,
      password: createUserDto.password,
      rememberMe: false,
    });

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPER.access_token,
      value: accessToken,
    });

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPER.refresh_token,
      value: refreshToken,
    });

    this.logger.log(
      `Usuário registrado com sucesso: ${JSON.stringify({ id: user.id, email: user.email, timestamp: new Date() })}`,
    );

    return {
      success: true,
      message: 'Registro realizado com sucesso.',
    };
  }
}
