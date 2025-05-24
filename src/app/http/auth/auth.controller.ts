
import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ResponseUserDto } from '../users/dto/response-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
 @Post("login")
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: 201, description: 'Login feito com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor' })
  @ApiBody({ type: ResponseUserDto })
  signIn(@Body() 
  responseUserDto:ResponseUserDto) {
    return this.authService.signIn(responseUserDto.email, responseUserDto.senha);
  }
}
