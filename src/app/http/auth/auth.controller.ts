import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';

import { COOKIES_MAPPER } from '@/domain/cookies';
import type { SignInWithEmailResponseSchema } from '@/domain/schemas/auth';
import { UtilsService } from '@/utils/utils.service';

import { SignInWithEmailDto } from './auth.dtos';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(
    private authService: AuthService,
    private utilsService: UtilsService,
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
    const { accessToken } = await this.authService.signIn(
      body.email,
      body.password,
    );

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPER.access_token,
      value: accessToken,
    });

    return {
      success: true,
      message: 'Login realizado com sucesso.',
    };
  }
}
