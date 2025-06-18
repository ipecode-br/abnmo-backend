// import { Body, Controller, Post } from '@nestjs/common';
// import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

// import { EnvelopeDTO } from '@/utils/envelope.dto';

// import { AuthService } from './auth.service';
// import { AuthDto } from './dto/auth.dto';

// @Controller()
// export class AuthController {
//   constructor(private authService: AuthService) {}
//   @Post('login')
//   @ApiOperation({ summary: 'Login' })
//   @ApiResponse({ status: 201, description: 'Login feito com sucesso' })
//   @ApiResponse({ status: 400, description: 'Dados inválidos' })
//   @ApiResponse({ status: 500, description: 'Erro interno no servidor' })
//   @ApiBody({ type: AuthDto })
//   async signIn(
//     @Body()
//     authDto: AuthDto,
//   ): Promise<EnvelopeDTO<string, undefined>> {
//     try {
//       const data = await this.authService.signIn(
//         authDto.email,
//         authDto.password,
//       );
//       if (!data) {
//         return {
//           success: false,
//           message: 'Erro ao ralizar login!',
//           data: undefined,
//         };
//       }
//       return {
//         success: true,
//         message: 'Login realizado com sucesso!',
//         data: data.access_token,
//       };
//     } catch (error: unknown) {
//       return {
//         success: false,
//         message:
//           error instanceof Error
//             ? error.message
//             : 'Erro interno ao realizar login!',
//         data: undefined,
//       };
//     }
//   }
// }
