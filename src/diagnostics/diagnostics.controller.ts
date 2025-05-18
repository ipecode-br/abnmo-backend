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

import { DiagnosticsService } from './diagnostics.service';
import { CreateDiagnosticDto } from './dto/create-diagnostic.dto';
import { Diagnostic } from './entities/diagnostic.entity';

@ApiTags('Diagnósticos')
@Controller('diagnostics')
export class DiagnosticsController {
  private readonly logger = new Logger(DiagnosticsController.name);

  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo diagnóstico' })
  @ApiResponse({ status: 201, description: 'Diagnóstico criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 500, description: 'Erro interno no servidor' })
  @ApiBody({ type: CreateDiagnosticDto })
  public async create(@Body() createDiagnosticDto: CreateDiagnosticDto) {
    const diagnostic =
      await this.diagnosticsService.create(createDiagnosticDto);

    this.logger.log(
      `Diagnóstico criado com sucesso: ${JSON.stringify(diagnostic)}`,
    );

    return diagnostic;
  }

  @Get()
  @ApiOperation({ summary: 'Retorna todos os diagnósticos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de diagnósticos retornada com sucesso',
    type: [Diagnostic],
  })
  public async findAll() {
    return await this.diagnosticsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um diagnóstico pelo ID' })
  @ApiResponse({ status: 200, description: 'Diagnóstico encontrado' })
  @ApiResponse({ status: 404, description: 'Diagnóstico não encontrado' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do diagnóstico' })
  public async findById(@Param('id', ParseIntPipe) id: number) {
    const diagnostic = await this.diagnosticsService.findById(id);

    this.logger.log(`Diagnóstico encontrado`);

    return diagnostic;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um diagnóstico pelo ID' })
  @ApiResponse({ status: 200, description: 'Diagnóstico removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Diagnóstico não encontrado' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID do diagnóstico' })
  public async remove(@Param('id', ParseIntPipe) id: number) {
    const diagnostic = await this.diagnosticsService.remove(id);

    this.logger.log(
      `Diagnóstico removido com sucesso: ${JSON.stringify(diagnostic)}`,
    );

    return diagnostic;
  }
}
