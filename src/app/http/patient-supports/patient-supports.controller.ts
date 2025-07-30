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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import {
  CreatePatientSupportResponseSchema,
  DeletePatientSupportResponseSchema,
  FindOnePatientsSupportResponseSchema,
  UpdatePatientSupportResponseSchema,
} from '@/domain/schemas/patient-support';
import { UserSchema } from '@/domain/schemas/user';

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
  @ApiResponse({
    status: 200,
    description: 'Contato de apoio retornado com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'ID inválido.' })
  @ApiResponse({ status: 404, description: 'Contato de apoio não encontrado.' })
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
  @ApiResponse({ status: 201, description: 'Apoio criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async createPatientSupport(
    @Param('patientId') patientId: string,
    @Body() createPatientSupportDto: CreatePatientSupportDto,
    @CurrentUser() user: UserSchema,
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
  @ApiOperation({ summary: 'Atualiza um contato de apoio por ID' })
  @ApiResponse({
    status: 200,
    description: 'Contato de apoio atualizado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'ID inválido.' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Contato de apoio não encontrado.' })
  async updatePatientSupport(
    @Param('id') id: string,
    @Body() updatePatientSupportDto: UpdatePatientSupportDto,
    @CurrentUser() user: UserSchema,
  ): Promise<UpdatePatientSupportResponseSchema> {
    const support = await this.patientSupportsRepository.findById(id);
    if (!support) {
      throw new NotFoundException('Contato de apoio não encontrado.');
    }
    const isPatientAccessingOwnData =
      user.role === 'patient' && user.id === support.patient_id;
    const isAdminNurseOrManager = ['admin', 'nurse', 'manager'].includes(
      user.role,
    );

    if (!isPatientAccessingOwnData && !isAdminNurseOrManager) {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este contato de apoio.',
      );
    }
    await this.patientSupportsService.update(id, updatePatientSupportDto);

    return {
      success: true,
      message: 'Contato de apoio atualizado com sucesso.',
    };
  }

  @Delete(':id')
  @Roles(['nurse', 'manager', 'patient'])
  @ApiOperation({ summary: 'Remove um contato de apoio pelo ID' })
  @ApiResponse({
    status: 200,
    description: 'Contato de apoio removido com sucesso',
  })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Contato de apoio não encontrado' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: UserSchema,
  ): Promise<DeletePatientSupportResponseSchema> {
    const support = await this.patientSupportsRepository.findById(id);
    if (!support) {
      throw new NotFoundException('Contato de apoio não encontrado.');
    }

    const isPatientAccessingOwnData =
      user.role === 'patient' && user.id === support.patient_id;

    const isAdminNurseOrManager = ['admin', 'nurse', 'manager'].includes(
      user.role,
    );

    if (!isPatientAccessingOwnData && !isAdminNurseOrManager) {
      throw new ForbiddenException(
        'Você não tem permissão para atualizar este contato de apoio.',
      );
    }
    await this.patientSupportsService.remove(id);

    return {
      success: true,
      message: 'Contato de apoio removido com sucesso.',
    };
  }
}
