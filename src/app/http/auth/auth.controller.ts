import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { type SignInWithEmailResponseSchema } from '@/domain/schemas/auth';

import { SignInWithEmailDto } from './auth.dtos';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiBody({ type: SignInWithEmailDto })
  @ApiOperation({ summary: 'Login do usuário.' })
  @ApiResponse({ status: 201, description: 'Login realizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async signIn(
    @Body() body: SignInWithEmailDto,
  ): Promise<SignInWithEmailResponseSchema> {
    try {
      const { access_token } = await this.authService.signIn(
        body.email,
        body.password,
      );

      // TODO: set Cookie with access_token generated after sign-in
      console.log(access_token);

      return {
        success: true,
        message: 'Login realizado com sucesso.',
      };
    } catch (error: unknown) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'A tentativa de login falhou.',
      };
    }
  }
}
