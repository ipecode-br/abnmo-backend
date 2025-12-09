import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import type {
  GetPatientsByCityResponse,
  GetPatientsByGenderResponse,
  GetReferredPatientsByStateResponse,
  GetTotalReferralsAndReferredPatientsPercentageResponse,
  GetTotalReferralsByCategoryResponse,
  TotalPatientsByCity,
  TotalPatientsByGender,
} from '@/domain/schemas/statistics/responses';

import {
  GetReferredPatientsByStateQuery,
  GetTotalPatientsByFieldQuery,
  GetTotalReferralsAndReferredPatientsPercentageQuery,
  GetTotalReferralsByCategoryQuery,
} from './statistics.dtos';
import { GetTotalAppointmentsUseCase } from './use-cases/get-total-appointments.use-case';
import { GetTotalPatientsByFieldUseCase } from './use-cases/get-total-patients-by-field.use-case';
import { GetTotalPatientsByStatusUseCase } from './use-cases/get-total-patients-by-status.use-case';
import { GetTotalReferralsAndReferredPatientsPercentageUseCase } from './use-cases/get-total-referrals-and-referred-patients-percentage.use-case';
import { GetTotalReferralsByCategoryUseCase } from './use-cases/get-total-referrals-by-category.use-case';
import { GetTotalReferredPatientsByStateUseCase } from './use-cases/get-total-referred-patients-by-state.use-case';

@ApiTags('Estatísticas')
@Roles(['manager', 'nurse'])
@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly getTotalPatientsByStatusUseCase: GetTotalPatientsByStatusUseCase,
    private readonly getTotalPatientsByPeriodUseCase: GetTotalPatientsByFieldUseCase,
    private readonly getTotalReferredPatientsByStateUseCase: GetTotalReferredPatientsByStateUseCase,
    private readonly getTotalReferralsByCategoryUseCase: GetTotalReferralsByCategoryUseCase,
    private readonly getTotalReferralsAndReferredPatientsPercentageUseCase: GetTotalReferralsAndReferredPatientsPercentageUseCase,
    private readonly getTotalAppointmentsUseCase: GetTotalAppointmentsUseCase,
  ) {}

  @Get('appointments-total')
  @ApiOperation({ summary: 'Número total de atendimentos' })
  async getTotalAppointments() {
    const total = await this.getTotalAppointmentsUseCase.execute();

    return {
      success: true,
      message: 'Número total de atendimentos retornado com sucesso.',
      data: { total },
    };
  }

  @Get('patients-total')
  @ApiOperation({ summary: 'Estatísticas totais de pacientes' })
  async getPatientsTotal() {
    const data = await this.getTotalPatientsByStatusUseCase.execute();

    return {
      success: true,
      message: 'Estatísticas com total de pacientes retornada com sucesso.',
      data,
    };
  }

  @Get('patients-by-gender')
  @ApiOperation({ summary: 'Estatísticas de pacientes por gênero' })
  async getPatientsByGender(
    @Query() query: GetTotalPatientsByFieldQuery,
  ): Promise<GetPatientsByGenderResponse> {
    const { items: genders, total } =
      await this.getTotalPatientsByPeriodUseCase.execute<TotalPatientsByGender>(
        {
          field: 'gender',
          query,
        },
      );

    return {
      success: true,
      message: 'Estatísticas de pacientes por gênero retornada com sucesso.',
      data: { genders, total },
    };
  }

  @Get('patients-by-city')
  @ApiOperation({ summary: 'Estatísticas de pacientes por cidade' })
  async getPatientsByCity(
    @Query() query: GetTotalPatientsByFieldQuery,
  ): Promise<GetPatientsByCityResponse> {
    const { items: cities, total } =
      await this.getTotalPatientsByPeriodUseCase.execute<TotalPatientsByCity>({
        field: 'city',
        query,
      });

    return {
      success: true,
      message: 'Estatísticas de pacientes por cidade retornada com sucesso.',
      data: { cities, total },
    };
  }

  @Get('referrals-total')
  @ApiOperation({ summary: 'Estatísticas do total de encaminhamentos' })
  async getTotalReferralsAndReferredPatientsPercentage(
    @Query() query: GetTotalReferralsAndReferredPatientsPercentageQuery,
  ): Promise<GetTotalReferralsAndReferredPatientsPercentageResponse> {
    const data =
      await this.getTotalReferralsAndReferredPatientsPercentageUseCase.execute({
        query,
      });

    return {
      success: true,
      message:
        'Estatísticas com total de encaminhamentos retornada com sucesso.',
      data,
    };
  }

  @Get('referrals-by-category')
  @ApiOperation({
    summary: 'Lista com o total de encaminhamentos por categoria',
  })
  async getTotalReferralsByCategory(
    @Query() query: GetTotalReferralsByCategoryQuery,
  ): Promise<GetTotalReferralsByCategoryResponse> {
    const { categories, total } =
      await this.getTotalReferralsByCategoryUseCase.execute({ query });

    return {
      success: true,
      message:
        'Lista com o total de encaminhamentos por categoria retornada com sucesso.',
      data: { categories, total },
    };
  }

  @Get('referrals-by-state')
  @ApiOperation({
    summary: 'Lista com o total de pacientes encaminhados por estado',
  })
  async getReferredPatientsByState(
    @Query() query: GetReferredPatientsByStateQuery,
  ): Promise<GetReferredPatientsByStateResponse> {
    const { states, total } =
      await this.getTotalReferredPatientsByStateUseCase.execute({ query });

    return {
      success: true,
      message:
        'Lista com o total de pacientes encaminhados por estado retornada com sucesso.',
      data: { states, total },
    };
  }
}
