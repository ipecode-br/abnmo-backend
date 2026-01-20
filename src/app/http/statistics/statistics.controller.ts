import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import type {
  TotalPatientsByCity,
  TotalPatientsByGender,
} from '@/domain/schemas/statistics/responses';

import {
  GetTotalAppointmentsResponse,
  GetTotalPatientsByCityResponse,
  GetTotalPatientsByFieldQuery,
  GetTotalPatientsByGenderResponse,
  GetTotalPatientsByStatusResponse,
  GetTotalReferralsByCategoryQuery,
  GetTotalReferralsByCategoryResponse,
  GetTotalReferralsQuery,
  GetTotalReferralsResponse,
  GetTotalReferredPatientsByStateQuery,
  GetTotalReferredPatientsByStateResponse,
  GetTotalReferredPatientsQuery,
  GetTotalReferredPatientsResponse,
} from './statistics.dtos';
import { GetTotalAppointmentsUseCase } from './use-cases/get-total-appointments.use-case';
import { GetTotalPatientsByFieldUseCase } from './use-cases/get-total-patients-by-field.use-case';
import { GetTotalPatientsByStatusUseCase } from './use-cases/get-total-patients-by-status.use-case';
import { GetTotalReferralsUseCase } from './use-cases/get-total-referrals.use-case';
import { GetTotalReferralsByCategoryUseCase } from './use-cases/get-total-referrals-by-category.use-case';
import { GetTotalReferredPatientsUseCase } from './use-cases/get-total-referred-patients.use-case';
import { GetTotalReferredPatientsByStateUseCase } from './use-cases/get-total-referred-patients-by-state.use-case';

@ApiTags('Estatísticas')
@Roles(['manager', 'nurse'])
@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly getTotalAppointmentsUseCase: GetTotalAppointmentsUseCase,
    private readonly getTotalPatientsByStatusUseCase: GetTotalPatientsByStatusUseCase,
    private readonly getTotalPatientsByPeriodUseCase: GetTotalPatientsByFieldUseCase,
    private readonly getTotalReferralsUseCase: GetTotalReferralsUseCase,
    private readonly getTotalReferredPatientsByStateUseCase: GetTotalReferredPatientsByStateUseCase,
    private readonly getTotalReferredPatientsUseCase: GetTotalReferredPatientsUseCase,
    private readonly getTotalReferralsByCategoryUseCase: GetTotalReferralsByCategoryUseCase,
  ) {}

  @Get('appointments-total')
  @ApiOperation({ summary: 'Retorna o número total de atendimentos' })
  @ApiResponse({ type: GetTotalAppointmentsResponse })
  async getTotalAppointments(
    @Query() query: GetTotalReferralsQuery,
  ): Promise<GetTotalAppointmentsResponse> {
    const { period } = query;

    const total = await this.getTotalAppointmentsUseCase.execute({ period });

    return {
      success: true,
      message: 'Número total de atendimentos retornado com sucesso.',
      data: { total },
    };
  }

  @Get('patients-total')
  @ApiOperation({ summary: 'Retorna o número total de pacientes' })
  @ApiResponse({ type: GetTotalPatientsByStatusResponse })
  async getTotalPatients(): Promise<GetTotalPatientsByStatusResponse> {
    const data = await this.getTotalPatientsByStatusUseCase.execute();

    return {
      success: true,
      message: 'Número total de pacientes retornado com sucesso.',
      data,
    };
  }

  @Get('patients-by-gender')
  @ApiOperation({ summary: 'Retorna o número total de pacientes por gênero' })
  @ApiResponse({ type: GetTotalPatientsByGenderResponse })
  async getPatientsByGender(
    @Query() query: GetTotalPatientsByFieldQuery,
  ): Promise<GetTotalPatientsByGenderResponse> {
    const { period, limit, order, withPercentage } = query;

    const { items: genders, total } =
      await this.getTotalPatientsByPeriodUseCase.execute<TotalPatientsByGender>(
        { field: 'gender', period, limit, order, withPercentage },
      );

    return {
      success: true,
      message:
        'Lista com o total de pacientes por gênero retornado com sucesso.',
      data: { genders, total },
    };
  }

  @Get('patients-by-city')
  @ApiOperation({ summary: 'Retorna o número total de pacientes por cidade' })
  @ApiResponse({ type: GetTotalPatientsByCityResponse })
  async getPatientsByCity(
    @Query() query: GetTotalPatientsByFieldQuery,
  ): Promise<GetTotalPatientsByCityResponse> {
    const { period, limit, order, withPercentage } = query;

    const { items: cities, total } =
      await this.getTotalPatientsByPeriodUseCase.execute<TotalPatientsByCity>({
        field: 'city',
        period,
        order,
        limit,
        withPercentage,
      });

    return {
      success: true,
      message:
        'Lista com o total de pacientes por cidade retornado com sucesso.',
      data: { cities, total },
    };
  }

  @Get('referrals-total')
  @ApiOperation({ summary: 'Retorna o número total de encaminhamentos' })
  @ApiResponse({ type: GetTotalReferralsResponse })
  async getTotalReferrals(
    @Query() query: GetTotalReferralsQuery,
  ): Promise<GetTotalReferralsResponse> {
    const { period } = query;

    const total = await this.getTotalReferralsUseCase.execute({ period });

    return {
      success: true,
      message: 'Número total de encaminhamentos retornado com sucesso.',
      data: { total },
    };
  }

  @Get('referrals-by-category')
  @ApiOperation({
    summary: 'Retorna o número total de encaminhamentos por categoria',
  })
  @ApiResponse({ type: GetTotalReferralsByCategoryResponse })
  async getTotalReferralsByCategory(
    @Query() query: GetTotalReferralsByCategoryQuery,
  ): Promise<GetTotalReferralsByCategoryResponse> {
    const { period } = query;

    const { categories, total } =
      await this.getTotalReferralsByCategoryUseCase.execute({ period });

    return {
      success: true,
      message:
        'Lista com o total de encaminhamentos por categoria retornada com sucesso.',
      data: { categories, total },
    };
  }

  @Get('referrals-by-state')
  @ApiOperation({
    summary: 'Retorna o número total de pacientes encaminhados por estado',
  })
  @ApiResponse({ type: GetTotalReferredPatientsByStateResponse })
  async getReferredPatientsByState(
    @Query() query: GetTotalReferredPatientsByStateQuery,
  ): Promise<GetTotalReferredPatientsByStateResponse> {
    const { period, limit } = query;

    const { states, total } =
      await this.getTotalReferredPatientsByStateUseCase.execute({
        period,
        limit,
      });

    return {
      success: true,
      message:
        'Lista com o total de pacientes encaminhados por estado retornada com sucesso.',
      data: { states, total },
    };
  }

  @Get('referred-patients-total')
  @ApiOperation({ summary: 'Retorna o número total de pacientes encaminhados' })
  @ApiResponse({ type: GetTotalReferredPatientsResponse })
  async getTotalReferredPatients(
    @Query() query: GetTotalReferredPatientsQuery,
  ): Promise<GetTotalReferredPatientsResponse> {
    const { period } = query;

    const total = await this.getTotalReferredPatientsUseCase.execute({
      period,
    });

    return {
      success: true,
      message: 'Número total de pacientes encaminhados retornado com sucesso.',
      data: { total },
    };
  }
}
