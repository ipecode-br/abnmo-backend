import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import type {
  GetPatientsByCityResponse,
  GetPatientsByGenderResponse,
  GetReferredPatientsByStateResponse,
  GetTotalReferralsAndReferredPatientsPercentageResponse,
  GetTotalReferralsByCategoryResponse,
  PatientsByCity,
  PatientsByGender,
} from '@/domain/schemas/statistics';

import {
  GetPatientsByPeriodQuery,
  GetReferredPatientsByStateQuery,
  GetTotalReferralsAndReferredPatientsPercentageQuery,
  GetTotalReferralsByCategoryQuery,
} from './statistics.dtos';
import { StatisticsService } from './statistics.service';
import { GetReferredPatientsByStateUseCase } from './use-cases/get-referred-patients-by-state.use-case';

@ApiTags('Estatísticas')
@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly getReferredPatientsByStateUseCase: GetReferredPatientsByStateUseCase,
  ) {}

  @Get('patients/total')
  @Roles(['manager', 'nurse'])
  @ApiOperation({ summary: 'Estatísticas totais de pacientes' })
  async getPatientsTotal() {
    const data = await this.statisticsService.getPatientsTotal();

    return {
      success: true,
      message: 'Estatísticas com total de pacientes retornada com sucesso.',
      data,
    };
  }

  @Get('patients-by-gender')
  @Roles(['manager', 'nurse'])
  @ApiOperation({ summary: 'Estatísticas de pacientes por gênero' })
  async getPatientsByGender(
    @Query() query: GetPatientsByPeriodQuery,
  ): Promise<GetPatientsByGenderResponse> {
    const { items: genders, total } =
      await this.statisticsService.getPatientsByPeriod<PatientsByGender>(
        'gender',
        query,
      );

    return {
      success: true,
      message: 'Estatísticas de pacientes por gênero retornada com sucesso.',
      data: { genders, total },
    };
  }

  @Get('patients-by-city')
  @Roles(['manager', 'nurse'])
  @ApiOperation({ summary: 'Estatísticas de pacientes por cidade' })
  async getPatientsByCity(
    @Query() query: GetPatientsByPeriodQuery,
  ): Promise<GetPatientsByCityResponse> {
    const { items: cities, total } =
      await this.statisticsService.getPatientsByPeriod<PatientsByCity>(
        'city',
        query,
      );

    return {
      success: true,
      message: 'Estatísticas de pacientes por cidade retornada com sucesso.',
      data: { cities, total },
    };
  }

  @Get('referrals-total')
  @Roles(['manager', 'nurse'])
  @ApiOperation({ summary: 'Estatísticas do total de encaminhamentos' })
  async getTotalReferralsAndReferredPatientsPercentage(
    @Query() query: GetTotalReferralsAndReferredPatientsPercentageQuery,
  ): Promise<GetTotalReferralsAndReferredPatientsPercentageResponse> {
    const data =
      await this.statisticsService.getTotalReferralsAndReferredPatientsPercentage(
        query,
      );

    return {
      success: true,
      message:
        'Estatísticas com total de encaminhamentos retornada com sucesso.',
      data,
    };
  }

  @Get('referrals-by-category')
  @Roles(['manager', 'nurse'])
  @ApiOperation({
    summary: 'Lista com o total de encaminhamentos por categoria',
  })
  async getTotalReferralsByCategory(
    @Query() query: GetTotalReferralsByCategoryQuery,
  ): Promise<GetTotalReferralsByCategoryResponse> {
    const { categories, total } =
      await this.statisticsService.getTotalReferralsByCategory(query);

    return {
      success: true,
      message:
        'Lista com o total de encaminhamentos por categoria retornada com sucesso.',
      data: { categories, total },
    };
  }

  @Get('referrals-by-state')
  @Roles(['manager', 'nurse'])
  @ApiOperation({
    summary: 'Lista com o total de pacientes encaminhados por estado',
  })
  async getReferredPatientsByState(
    @Query() query: GetReferredPatientsByStateQuery,
  ): Promise<GetReferredPatientsByStateResponse> {
    const { states, total } =
      await this.getReferredPatientsByStateUseCase.execute({ query });

    return {
      success: true,
      message:
        'Lista com o total de pacientes encaminhados por estado retornada com sucesso.',
      data: { states, total },
    };
  }
}
