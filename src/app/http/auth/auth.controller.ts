import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}
  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: 201, description: 'Login feito com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor' })
  @ApiBody({ type: AuthDto })
  async signIn(
    @Body()
    authDto: AuthDto,
  ) {
    try {
      const data = await this.authService.signIn(authDto.email, authDto.senha);
      if (data) {
        return {
          success: true,
          message: 'Login realizado com sucesso!',
          data: data.access_token,
        };
      }
    } catch (error) {
      if (error) {
        return {
          success: false,
          message: 'Erro ao realizar login',
          data: null,
        };
      }
    }
  }
}
