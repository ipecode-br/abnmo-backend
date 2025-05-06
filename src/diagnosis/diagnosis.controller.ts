import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DiagnosisService } from './diagnosis.service';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { Diagnosis } from './entities/diagnosis.entity';

@ApiTags('Diagnósticos') // Define a categoria no Swagger
@Controller('diagnosis')
export class DiagnosisController {
  // Instância do Logger
  private readonly logger = new Logger(DiagnosisController.name);

  constructor(private readonly diagnosisService: DiagnosisService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo diagnóstico' })
  @ApiResponse({ status: 201, description: 'Diagnóstico criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor' })
  @ApiBody({ type: CreateDiagnosisDto })
  public async create(@Body() createDiagnosisDto: CreateDiagnosisDto) {
    const diagnosis = await this.diagnosisService.create(createDiagnosisDto);

    this.logger.log(
      `Diagnóstico criado com sucesso: ${JSON.stringify(diagnosis)}`,
    );

    return diagnosis;
  }

  @Get()
  @ApiOperation({ summary: 'Retorna todos os diagnósticos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de diagnósticos retornada com sucesso',
    type: [Diagnosis],
  })
  public async findAll() {
    return await this.diagnosisService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um diagnóstico pelo ID' })
  @ApiResponse({ status: 200, description: 'Diagnóstico encontrado' })
  @ApiResponse({ status: 404, description: 'Diagnóstico não encontrado' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do diagnóstico' })
  public async findById(@Param('id', ParseIntPipe) id: number) {
    const diagnosis = await this.diagnosisService.findById(id);

    this.logger.log(`Diagnóstico encontrado`);

    return diagnosis;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um diagnóstico pelo ID' })
  @ApiResponse({ status: 200, description: 'Diagnóstico removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Diagnóstico não encontrado' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do diagnóstico' })
  public async remove(@Param('id', ParseIntPipe) id: number) {
    const diagnosis = await this.diagnosisService.remove(id);

    this.logger.log(
      `Diagnóstico removido com sucesso: ${JSON.stringify(diagnosis)}`,
    );

    return diagnosis;
  }
}
