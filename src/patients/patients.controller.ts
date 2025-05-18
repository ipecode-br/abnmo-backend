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

import { CreatePatientDto } from './dto/create-patient.dto';
import { Patient } from './entities/patient.entity';
import { PatientsService } from './patients.service';

@ApiTags('Pacientes')
@Controller('patients')
export class PatientsController {
  private readonly logger = new Logger(PatientsController.name);

  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo paciente' })
  @ApiResponse({
    status: 201,
    description: 'Paciente criado com sucesso',
    type: Patient,
  })
  @ApiResponse({
    status: 209,
    description: 'Paciente já cadastrado',
  })
  public async create(
    @Body() createPatientDto: CreatePatientDto,
  ): Promise<Patient> {
    await validateDto(createPatientDto);

    const patient = await this.patientsService.create(createPatientDto);

    this.logger.log(`Paciente criado com sucesso: ${JSON.stringify(patient)}`);

    return patient;
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os pacientes' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pacientes',
    type: [Patient],
  })
  public async findAll(): Promise<Patient[]> {
    return await this.patientsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um paciente pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Paciente encontrado',
    type: Patient,
  })
  @ApiResponse({ status: 404, description: 'Paciente não encontrado' })
  public async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Patient> {
    const patient = await this.patientsService.findById(id);

    this.logger.log(`Paciente encontrado`);

    return patient;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um paciente pelo ID' })
  @ApiResponse({ status: 200, description: 'Paciente removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Paciente não encontrado' })
  public async remove(@Param('id', ParseIntPipe) id: number): Promise<Patient> {
    const patient = await this.patientsService.remove(id);

    this.logger.log(
      `Paciente removido com sucesso: ${JSON.stringify(patient)}`,
    );

    return patient;
  }
}
