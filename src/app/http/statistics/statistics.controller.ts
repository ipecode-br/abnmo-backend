import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import type {
  GetPatientsByCityResponse,
  GetPatientsByGenderResponse,
  GetTotalReferralsAndReferredPatientsPercentageResponse,
  GetTotalReferredPatientsByStateResponse,
  PatientsByCity,
  PatientsByGender,
} from '@/domain/schemas/statistics';

import {
  GetPatientsByPeriodQuery,
  GetTotalReferralsAndReferredPatientsPercentageQuery,
  GetTotalReferredPatientsByStateQuery,
} from './statistics.dtos';
import { StatisticsService } from './statistics.service';

@ApiTags('Estatísticas')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

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

  @Get('referrals-by-state')
  @Roles(['manager', 'nurse'])
  @ApiOperation({
    summary: 'Estatísticas de pacientes encaminhados por estado',
  })
  async getPatientsWithReferralsByState(
    @Query() query: GetTotalReferredPatientsByStateQuery,
  ): Promise<GetTotalReferredPatientsByStateResponse> {
    const { states, total } =
      await this.statisticsService.getReferredPatientsByState(query);

    return {
      success: true,
      message:
        'Estatísticas de pacientes encaminhados por estado retornada com sucesso.',
      data: { states, total },
    };
  }
}
