// import {
//   Body,
//   Controller,
//   Delete,
//   Get,
//   Logger,
//   Param,
//   ParseIntPipe,
//   Patch,
//   Post,
// } from '@nestjs/common';
// import {
//   ApiBody,
//   ApiOperation,
//   ApiParam,
//   ApiResponse,
//   ApiTags,
// } from '@nestjs/swagger';

// import { User } from '@/domain/entities/user';
// import { EnvelopeDTO } from '@/utils/envelope.dto';
// import { validateDto } from '@/utils/validate.dto';

// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
// import { UsersService } from './users.service';

// @ApiTags('Usuários')
// @Controller('users')
// export class UsersController {
//   private readonly logger = new Logger(UsersController.name);

//   constructor(private readonly userService: UsersService) {}

//   @Post()
//   @ApiOperation({ summary: 'Cria um novo usuário' })
//   @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
//   @ApiResponse({ status: 400, description: 'Dados inválidos' })
//   @ApiResponse({ status: 500, description: 'Erro interno no servidor' })
//   @ApiBody({ type: CreateUserDto })
//   public async create(
//     @Body() createUserDto: CreateUserDto,
//   ): Promise<EnvelopeDTO<User, undefined>> {
//     try {
//       await validateDto(createUserDto);

//       const user = await this.userService.create(createUserDto);
//       if (!user) {
//         return {
//           success: false,
//           message: 'Erro ao criar usuário!',
//           data: undefined,
//         };
//       }
//       this.logger.log(`Usuário criado com sucesso: ${JSON.stringify(user)}`);
//       return {
//         success: true,
//         message: 'Usuário criado com sucesso!',
//         data: user,
//       };
//     } catch (error: any) {
//       return {
//         success: false,
//         message:
//           error instanceof Error
//             ? error.message
//             : 'Erro interno ao criar usuário!',
//         data: undefined,
//       };
//     }
//   }

//   @Get()
//   @ApiOperation({ summary: 'Retorna todos os usuários' })
//   @ApiResponse({
//     status: 200,
//     description: 'Lista de usuários retornada com sucesso',
//     type: [User],
//   })
//   public async findAll(): Promise<EnvelopeDTO<User[], undefined>> {
//     try {
//       const users = await this.userService.findAll();
//       if (!users) {
//         return {
//           success: false,
//           message: 'Erro ao encontrar usuários',
//           data: undefined,
//         };
//       }
//       return {
//         success: true,
//         message: 'Lista de usuários',
//         data: users,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message:
//           error instanceof Error
//             ? error.message
//             : 'Erro interno ao encontrar usuários',
//         data: undefined,
//       };
//     }
//   }

//   @Get(':id')
//   @ApiOperation({ summary: 'Busca um usuário pelo ID' })
//   @ApiResponse({ status: 200, description: 'Usuário encontrado' })
//   @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
//   @ApiParam({ name: 'id', type: 'number', description: 'ID do usuário' })
//   public async findById(
//     @Param('id', ParseIntPipe) id: number,
//   ): Promise<EnvelopeDTO<User, undefined>> {
//     try {
//       const user = await this.userService.findById(id);
//       if (!user) {
//         return {
//           success: false,
//           message: 'Erro ao encontrar usuário!',
//           data: undefined,
//         };
//       }
//       this.logger.log(`Usuário encontrado`);

//       return {
//         success: true,
//         message: 'Usuário encontrado com sucesso!',
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message:
//           error instanceof Error
//             ? error.message
//             : 'Erro  interno ao encontrar usuário!',
//         data: undefined,
//       };
//     }
//   }

//   @Patch(':id')
//   @ApiOperation({ summary: 'Atualiza um usuário pelo ID' })
//   @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
//   @ApiResponse({ status: 400, description: 'Dados inválidos' })
//   @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
//   @ApiParam({ name: 'id', type: 'number', description: 'ID do usuário' })
//   @ApiBody({ type: UpdateUserDto })
//   public async update(
//     @Param('id', ParseIntPipe) id: number,
//     @Body() updateUserDto: UpdateUserDto,
//   ): Promise<EnvelopeDTO<User, undefined>> {
//     try {
//       await validateDto(UpdateUserDto);

//       const user = await this.userService.update(id, updateUserDto);
//       if (!user) {
//         return {
//           success: false,
//           message: 'Erro ao atualizar usuário!',
//           data: undefined,
//         };
//       }
//       this.logger.log(
//         `Usuário atualizado com sucesso: ${JSON.stringify(user)}`,
//       );

//       return {
//         success: true,
//         message: 'Usuário atualizado com sucesso',
//         data: user,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message:
//           error instanceof Error
//             ? error.message
//             : 'Erro interno ao atualizar usuário!',
//         data: undefined,
//       };
//     }
//   }

//   @Delete(':id')
//   @ApiOperation({ summary: 'Remove um usuário pelo ID' })
//   @ApiResponse({ status: 200, description: 'Usuário removido com sucesso' })
//   @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
//   @ApiParam({ name: 'id', type: 'number', description: 'ID do usuário' })
//   public async remove(
//     @Param('id', ParseIntPipe) id: number,
//   ): Promise<EnvelopeDTO<User, undefined>> {
//     try {
//       const user = await this.userService.remove(id);
//       if (!user) {
//         return {
//           success: false,
//           message: 'Erro ao remover usuário!',
//           data: undefined,
//         };
//       }
//       this.logger.log(`Usuário removido com sucesso: ${JSON.stringify(user)}`);

//       return {
//         success: true,
//         message: 'Usuário removido com sucesso',
//         data: user,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         message:
//           error instanceof Error
//             ? error.message
//             : 'Erro interno ao remover usuário!',
//         data: undefined,
//       };
//     }
//   }
// }
