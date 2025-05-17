import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { validateDto } from '@/common/utils/validate.dto';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('Usuários')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly userService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor' })
  @ApiBody({ type: CreateUserDto })
  public async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    await validateDto(createUserDto);

    const user = await this.userService.create(createUserDto);

    this.logger.log(`Usuário criado com sucesso: ${JSON.stringify(user)}`);

    return user;
  }

  @Get()
  @ApiOperation({ summary: 'Retorna todos os usuários' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso',
    type: [User],
  })
  public async findAll(): Promise<User[]> {
    return await this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um usuário pelo ID' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do usuário' })
  public async findById(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await this.userService.findById(id);

    this.logger.log(`Usuário encontrado`);

    return user;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um usuário pelo ID' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do usuário' })
  @ApiBody({ type: UpdateUserDto })
  public async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    await validateDto(UpdateUserDto);

    const user = await this.userService.update(id, updateUserDto);

    this.logger.log(`Usuário atualizado com sucesso: ${JSON.stringify(user)}`);

    return user;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um usuário pelo ID' })
  @ApiResponse({ status: 200, description: 'Usuário removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do usuário' })
  public async remove(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await this.userService.remove(id);

    this.logger.log(`Usuário removido com sucesso: ${JSON.stringify(user)}`);

    return user;
  }
}
