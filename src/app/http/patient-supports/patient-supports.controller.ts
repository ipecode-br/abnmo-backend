import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { User } from '@/domain/entities/user';
import {
  CreatePatientSupportResponseSchema,
  DeletePatientSupportResponseSchema,
  FindOnePatientsSupportResponseSchema,
  UpdatePatientSupportResponseSchema,
} from '@/domain/schemas/patient-support';

import { CreatePatientSupportDto } from '../patient-supports/patient-supports.dtos';
import { UpdatePatientSupportDto } from './patient-supports.dtos';
import { PatientSupportsRepository } from './patient-supports.repository';
import { PatientSupportsService } from './patient-supports.service';

@ApiTags('Rede de apoio')
@Controller('patient-supports')
export class PatientSupportsController {
  constructor(
    private readonly patientSupportsService: PatientSupportsService,
    private readonly patientSupportsRepository: PatientSupportsRepository,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Busca um contato de apoio pelo ID' })
  async findById(
    @Param('id') id: string,
  ): Promise<FindOnePatientsSupportResponseSchema> {
    const patientSupport = await this.patientSupportsRepository.findById(id);

    if (!patientSupport) {
      throw new NotFoundException('Contato de apoio não encontrado.');
    }

    return {
      success: true,
      message: 'Contato de apoio retornado com sucesso.',
      data: patientSupport,
    };
  }

  @Post(':patientId')
  @Roles(['nurse', 'manager', 'patient'])
  @ApiOperation({
    summary: 'Registra um novo contato de apoio para um paciente',
  })
  async createPatientSupport(
    @Param('patientId') patientId: string,
    @Body() createPatientSupportDto: CreatePatientSupportDto,
    @CurrentUser() user: User,
  ): Promise<CreatePatientSupportResponseSchema> {
    if (user.role === 'patient' && user.id !== patientId) {
      throw new ForbiddenException(
        'Você não tem permissão para registrar contatos de apoio para este paciente.',
      );
    }

    await this.patientSupportsService.create(
      createPatientSupportDto,
      patientId,
    );

    return {
      success: true,
      message: 'Contato de apoio registrado com sucesso.',
    };
  }

  @Put(':id')
  @Roles(['nurse', 'manager', 'patient'])
  @ApiOperation({ summary: 'Atualiza um contato de apoio pelo ID' })
  async updatePatientSupport(
    @Param('id') id: string,
    @Body() updatePatientSupportDto: UpdatePatientSupportDto,
    @CurrentUser() user: User,
  ): Promise<UpdatePatientSupportResponseSchema> {
    await this.patientSupportsService.update(id, updatePatientSupportDto, user);

    return {
      success: true,
      message: 'Contato de apoio atualizado com sucesso.',
    };
  }

  @Delete(':id')
  @Roles(['nurse', 'manager', 'patient'])
  @ApiOperation({ summary: 'Remove um contato de apoio pelo ID' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<DeletePatientSupportResponseSchema> {
    await this.patientSupportsService.remove(id, user);

    return {
      success: true,
      message: 'Contato de apoio removido com sucesso.',
    };
  }
}
