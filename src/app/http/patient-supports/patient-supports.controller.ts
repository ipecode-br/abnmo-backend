import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthUser } from '@/common/decorators/auth-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import type { BaseResponse } from '@/domain/schemas/base';

import type { AuthUserDto } from '../auth/auth.dtos';
import {
  CreatePatientSupportDto,
  UpdatePatientSupportDto,
} from './patient-supports.dtos';
import { CreatePatientSupportUseCase } from './use-cases/create-patient-support.use-case';
import { DeletePatientSupportUseCase } from './use-cases/delete-patient-support.use-case';
import { UpdatePatientSupportUseCase } from './use-cases/update-patient-support.use-case';

@ApiTags('Rede de apoio')
@Controller('patient-supports')
export class PatientSupportsController {
  constructor(
    private readonly createPatientSupportUseCase: CreatePatientSupportUseCase,
    private readonly updatePatientSupportUseCase: UpdatePatientSupportUseCase,
    private readonly deletePatientSupportUseCase: DeletePatientSupportUseCase,
  ) {}

  @Post(':patientId')
  @Roles(['nurse', 'manager', 'patient'])
  @ApiOperation({
    summary: 'Registra um novo contato de apoio para um paciente',
  })
  async createPatientSupport(
    @Param('patientId') patientId: string,
    @AuthUser() user: AuthUserDto,
    @Body() createPatientSupportDto: CreatePatientSupportDto,
  ): Promise<BaseResponse> {
    await this.createPatientSupportUseCase.execute({
      user,
      patientId,
      createPatientSupportDto,
    });

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
    @AuthUser() user: AuthUserDto,
    @Body() updatePatientSupportDto: UpdatePatientSupportDto,
  ): Promise<BaseResponse> {
    await this.updatePatientSupportUseCase.execute({
      id,
      user,
      updatePatientSupportDto,
    });

    return {
      success: true,
      message: 'Contato de apoio atualizado com sucesso.',
    };
  }

  @Delete(':id')
  @Roles(['nurse', 'manager', 'patient'])
  @ApiOperation({ summary: 'Remove um contato de apoio pelo ID' })
  async removePatientSupport(
    @Param('id') id: string,
    @AuthUser() user: AuthUserDto,
  ): Promise<BaseResponse> {
    await this.deletePatientSupportUseCase.execute({ id, user });

    return {
      success: true,
      message: 'Contato de apoio removido com sucesso.',
    };
  }
}
