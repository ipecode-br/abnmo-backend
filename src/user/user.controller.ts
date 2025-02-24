import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Usuários') // Define a categoria no Swagger
@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name); // Instância do Logger

  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor' })
  @ApiBody({ type: CreateUserDto })
  async create(@Body() createUserDto: CreateUserDto) {
    this.logger.log('Recebida solicitação para criar um novo usuário'); // Log informativo

    try {
      const createUser = await this.userService.createUser(createUserDto);

      if (!createUser) {
        this.logger.error('Erro ao criar usuário'); // Log de erro
        throw new HttpException('Erro ao criar usuário', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      this.logger.log(`Usuário criado com sucesso: ${JSON.stringify(createUser)}`); // Log de sucesso
      return createUser;
      
    } catch (error) {
      this.logger.error(`Erro ao criar usuário: ${error.message}`, error.stack); // Log detalhado com stack trace

      throw new HttpException(
        error.message || 'Erro ao criar usuário',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Retorna todos os usuários' })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um usuário pelo ID' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do usuário' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um usuário pelo ID' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do usuário' })
  @ApiBody({ type: UpdateUserDto })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um usuário pelo ID' })
  @ApiResponse({ status: 200, description: 'Usuário removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do usuário' })
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
