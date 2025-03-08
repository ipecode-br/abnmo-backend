import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
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
import { DiagnosticoService } from './diagnostico.service';
import { CreateDiagnosticoDto } from './dto/create-diagnostico.dto';
import { UpdateDiagnosticoDto } from './dto/update-diagnostico.dto';
import { Diagnostico } from './entities/diagnostico.entity';

@ApiTags('Diagnósticos') // Define a categoria no Swagger
@Controller('diagnostico')
export class DiagnosticoController {
  private readonly logger = new Logger(DiagnosticoController.name); // Instância do Logger
  constructor(private readonly diagnosticoService: DiagnosticoService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo diagnostico' })
  @ApiResponse({ status: 201, description: 'Diagnóstico criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor' })
  @ApiBody({ type: CreateDiagnosticoDto })
  async create(@Body() createDiagnosticoDto: CreateDiagnosticoDto) {
    this.logger.log('Recebida solicitação para criar um novo diagnóstico'); // Log informativo

    try {
      const createDiagnostico =
        await this.diagnosticoService.create(createDiagnosticoDto);

      if (!createDiagnostico) {
        this.logger.error('Erro ao criar um diagnóstico');
        throw new HttpException(
          'Erro ao criar um diagnóstico',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.logger.log(
        `Diagnóstico criado com sucesso: ${JSON.stringify(createDiagnostico)}`,
      );
      return createDiagnostico;
    } catch (error: unknown) {
      // Verifica se o erro é uma instância de Error
      if (error instanceof Error) {
        this.logger.error(
          `Erro ao criar diagnóstico: ${error.message}`,
          error.stack,
        );
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Se o erro não for uma instância de Error, trata como erro genérico
      this.logger.error('Erro desconhecido ao criar diagnóstico');
      throw new HttpException(
        'Erro interno no servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Retorna todos os diagnósticos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de diagnósticos retornada com sucesso',
    type: [Diagnostico],
  })
  findAll() {
    return this.diagnosticoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um diagnóstico pelo ID' })
  @ApiResponse({ status: 200, description: 'Diagnóstico encontrado' })
  @ApiResponse({ status: 404, description: 'Diagnóstico não encontrado' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do diagnóstico' })
  findOne(@Param('id') id: string) {
    return this.diagnosticoService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um diagnóstico pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Diagnóstico atualizado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Diagnóstico não encontrado' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do diagnóstico' })
  @ApiBody({ type: UpdateDiagnosticoDto })
  update(
    @Param('id') id: string,
    @Body() updateDiagnosticoDto: UpdateDiagnosticoDto,
  ) {
    return this.diagnosticoService.update(+id, updateDiagnosticoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um diagnóstico pelo ID' })
  @ApiResponse({ status: 200, description: 'Diagnóstico removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Diagnóstico não encontrado' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do diagnóstico' })
  remove(@Param('id') id: string) {
    return this.diagnosticoService.remove(+id);
  }
}
