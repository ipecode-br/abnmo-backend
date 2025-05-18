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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { validateDto } from 'src/common/utils/validate.dto';

import { CreatePatientSupportDto } from './dto/create-patient-support.dto';
import { PatientSupport } from './entities/patient-support.entity';
import { PatientSupportsService } from './patient-supports.service';

@ApiTags('Apoios')
@Controller('patient-supports')
export class PatientSupportsController {
  private readonly logger = new Logger(PatientSupportsController.name);

  constructor(
    private readonly patientSupportsService: PatientSupportsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo apoio' })
  @ApiResponse({
    status: 201,
    description: 'Apoio criado com sucesso',
    type: PatientSupport,
  })
  @ApiResponse({
    status: 409,
    description: 'Apoio já cadastrado para esse paciente',
  })
  public async create(
    @Body() createPatientSupportDto: CreatePatientSupportDto,
  ): Promise<PatientSupport> {
    await validateDto(createPatientSupportDto);

    const support = await this.patientSupportsService.create(
      createPatientSupportDto,
    );

    this.logger.log(`Apoio criado com sucesso: ${JSON.stringify(support)}`);

    return support;
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os apoios' })
  @ApiResponse({
    status: 200,
    description: 'Lista de apoios',
    type: [PatientSupport],
  })
  public async findAll(): Promise<PatientSupport[]> {
    return await this.patientSupportsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um apoio pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Apoio encontrado',
    type: PatientSupport,
  })
  @ApiResponse({ status: 404, description: 'Apoio não encontrado' })
  public async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PatientSupport> {
    const support = await this.patientSupportsService.findById(id);

    this.logger.log(`Apoio encontrado`);

    return support;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um apoio pelo ID' })
  @ApiResponse({ status: 200, description: 'Apoio removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Apoio não encontrado' })
  public async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PatientSupport> {
    const support = await this.patientSupportsService.remove(id);

    this.logger.log(`Apoio removido com sucesso: ${JSON.stringify(support)}`);

    return support;
  }
}
