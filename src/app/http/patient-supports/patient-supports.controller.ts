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

import { AuthUser } from '@/common/decorators/auth-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { BaseResponse } from '@/domain/schemas/base';
import type { GetPatientSupportResponse } from '@/domain/schemas/patient-support/responses';

import type { AuthUserDto } from '../auth/auth.dtos';
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
  async findById(@Param('id') id: string): Promise<GetPatientSupportResponse> {
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
  @Roles(['nurse', 'manager'])
  @ApiOperation({
    summary: 'Registra um novo contato de apoio para um paciente',
  })
  async createPatientSupport(
    @Param('patientId') patientId: string,
    @AuthUser() authUser: AuthUserDto,
    @Body() createPatientSupportDto: CreatePatientSupportDto,
  ): Promise<BaseResponse> {
    if (authUser.role === 'patient' && authUser.id !== patientId) {
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
  @Roles(['nurse', 'manager'])
  @ApiOperation({ summary: 'Atualiza um contato de apoio pelo ID' })
  async updatePatientSupport(
    @Param('id') id: string,
    @AuthUser() authUser: AuthUserDto,
    @Body() updatePatientSupportDto: UpdatePatientSupportDto,
  ): Promise<BaseResponse> {
    await this.patientSupportsService.update(
      id,
      updatePatientSupportDto,
      authUser,
    );

    return {
      success: true,
      message: 'Contato de apoio atualizado com sucesso.',
    };
  }

  @Delete(':id')
  @Roles(['nurse', 'manager'])
  @ApiOperation({ summary: 'Remove um contato de apoio pelo ID' })
  async remove(
    @Param('id') id: string,
    @AuthUser() authUser: AuthUserDto,
  ): Promise<BaseResponse> {
    await this.patientSupportsService.remove(id, authUser);

    return {
      success: true,
      message: 'Contato de apoio removido com sucesso.',
    };
  }
}
