import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { Paciente } from './entities/paciente.entity';
import { PacienteService } from './paciente.service';

@ApiTags('Paciente')
@Controller('paciente')
export class PacienteController {
  private readonly logger = new Logger(PacienteController.name); // Instância do Logger
  constructor(private readonly pacienteService: PacienteService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo paciente' })
  @ApiResponse({
    status: 201,
    description: 'Paciente criado com sucesso',
    type: Paciente,
  })
  async create(
    @Body() createPacienteDto: CreatePacienteDto,
  ): Promise<Paciente> {
    this.logger.log('Recebida solicitação para criar um novo diagnóstico'); // Log informativo

    try {
      const createPaciente =
        await this.pacienteService.create(createPacienteDto);

      if (!createPaciente) {
        this.logger.error('Erro ao criar o paciente');
        throw new HttpException(
          'Erro ao criar o paciente',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.logger.log(
        `Paciente criado com sucesso: ${JSON.stringify(createPaciente)}`,
      );
      return createPaciente;
    } catch (error: unknown) {
      // Verifica se o erro é uma instância de Error
      if (error instanceof Error) {
        this.logger.error(
          `Erro ao criar paciente: ${error.message}`,
          error.stack,
        );
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Se o erro não for uma instância de Error, trata como erro genérico
      this.logger.error('Erro desconhecido ao criar paciente');
      throw new HttpException(
        'Erro interno no servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os pacientes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pacientes',
    type: [Paciente],
  })
  async findAll(): Promise<Paciente[]> {
    return this.pacienteService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um paciente pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Paciente encontrado',
    type: Paciente,
  })
  @ApiResponse({ status: 404, description: 'Paciente não encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Paciente> {
    return this.pacienteService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um paciente pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Paciente atualizado',
    type: Paciente,
  })
  @ApiResponse({ status: 404, description: 'Paciente não encontrado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePacienteDto: UpdatePacienteDto,
  ): Promise<Paciente> {
    return this.pacienteService.update(id, updatePacienteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um paciente pelo ID' })
  @ApiResponse({ status: 204, description: 'Paciente removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Paciente não encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.pacienteService.remove(id);
  }
}
