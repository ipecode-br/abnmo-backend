import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { RequireFeature } from '@/common/decorators/require-feature.decorator';
import type {
  TotalPatientsByGender,
  TotalPatientsByState,
  TotalPatientsWithAppointmentsByState,
  TotalPatientsWithReferralsByState,
} from '@/domain/schemas/statistics/responses';

import {
  GetTotalAppointmentsByCategoryQuery,
  GetTotalAppointmentsByCategoryResponse,
  GetTotalAppointmentsResponse,
  GetTotalPatientsByFieldQuery,
  GetTotalPatientsByGenderResponse,
  GetTotalPatientsByStateResponse,
  GetTotalPatientsResponse,
  GetTotalPatientsWithAppointmentsByStateQuery,
  GetTotalPatientsWithAppointmentsByStateResponse,
  GetTotalPatientsWithAppointmentsQuery,
  GetTotalPatientsWithAppointmentsResponse,
  GetTotalPatientsWithReferralsByStateQuery,
  GetTotalPatientsWithReferralsByStateResponse,
  GetTotalPatientsWithReferralsQuery,
  GetTotalPatientsWithReferralsResponse,
  GetTotalReferralsByCategoryQuery,
  GetTotalReferralsByCategoryResponse,
  GetTotalReferralsQuery,
  GetTotalReferralsResponse,
} from './statistics.dtos';
import { GetTotalAppointmentsUseCase } from './use-cases/get-total-appointments.use-case';
import { GetTotalAppointmentsByCategoryUseCase } from './use-cases/get-total-appointments-by-category.use-case';
import { GetTotalPatientsUseCase } from './use-cases/get-total-patients.use-case';
import { GetTotalPatientsByFieldUseCase } from './use-cases/get-total-patients-by-field.use-case';
import { GetTotalPatientsWithAppointmentsUseCase } from './use-cases/get-total-patients-with-appointments.use-case';
import { GetTotalPatientsWithAppointmentsByFieldUseCase } from './use-cases/get-total-patients-with-appointments-by-field.use-case';
import { GetTotalPatientsWithReferralsUseCase } from './use-cases/get-total-patients-with-referrals.use-case';
import { GetTotalPatientsWithReferralsByFieldUseCase } from './use-cases/get-total-patients-with-referrals-by-field.use-case';
import { GetTotalReferralsUseCase } from './use-cases/get-total-referrals.use-case';
import { GetTotalReferralsByCategoryUseCase } from './use-cases/get-total-referrals-by-category.use-case';

@ApiTags('Estatísticas')
@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly getTotalAppointmentsByCategoryUseCase: GetTotalAppointmentsByCategoryUseCase,
    private readonly getTotalAppointmentsUseCase: GetTotalAppointmentsUseCase,
    private readonly getTotalPatientsByFieldUseCase: GetTotalPatientsByFieldUseCase,
    private readonly getTotalPatientsUseCase: GetTotalPatientsUseCase,
    private readonly getTotalPatientsWithAppointmentsByFieldUseCase: GetTotalPatientsWithAppointmentsByFieldUseCase,
    private readonly getTotalPatientsWithAppointmentsUseCase: GetTotalPatientsWithAppointmentsUseCase,
    private readonly getTotalPatientsWithReferralsByFieldUseCase: GetTotalPatientsWithReferralsByFieldUseCase,
    private readonly getTotalPatientsWithReferralsUseCase: GetTotalPatientsWithReferralsUseCase,
    private readonly getTotalReferralsByCategoryUseCase: GetTotalReferralsByCategoryUseCase,
    private readonly getTotalReferralsUseCase: GetTotalReferralsUseCase,
  ) {}

  // Appointments

  @Get('appointments/total')
  @RequireFeature('read:statistic')
  @ApiOperation({ summary: 'Número total de atendimentos' })
  @ZodResponse({ status: 200, type: GetTotalAppointmentsResponse })
  async getTotalAppointments(
    @Query() query: GetTotalReferralsQuery,
  ): Promise<GetTotalAppointmentsResponse> {
    const total = await this.getTotalAppointmentsUseCase.execute(query);

    return {
      success: true,
      message: 'Número total de atendimentos retornado com sucesso.',
      data: { total },
    };
  }

  @Get('appointments/by-category')
  @RequireFeature('read:statistic')
  @ApiOperation({
    summary: 'Número total de atendimentos por categoria',
  })
  @ZodResponse({ status: 200, type: GetTotalAppointmentsByCategoryResponse })
  async getTotalAppointmentsByCategory(
    @Query() query: GetTotalAppointmentsByCategoryQuery,
  ): Promise<GetTotalAppointmentsByCategoryResponse> {
    const { categories, total } =
      await this.getTotalAppointmentsByCategoryUseCase.execute(query);

    return {
      success: true,
      message:
        'Lista com o total de atendimentos por categoria retornada com sucesso.',
      data: { categories, total },
    };
  }

  // Patients

  @Get('patients/total')
  @RequireFeature('read:statistic')
  @ApiOperation({ summary: 'Número total de pacientes' })
  @ZodResponse({ status: 200, type: GetTotalPatientsResponse })
  async getTotalPatients(): Promise<GetTotalPatientsResponse> {
    const total = await this.getTotalPatientsUseCase.execute();

    return {
      success: true,
      message: 'Número total de pacientes retornado com sucesso.',
      data: { total },
    };
  }

  @Get('patients/by-gender')
  @RequireFeature('read:statistic')
  @ApiOperation({ summary: 'Número total de pacientes por gênero' })
  @ZodResponse({ status: 200, type: GetTotalPatientsByGenderResponse })
  async getTotalPatientsByGender(
    @Query() query: GetTotalPatientsByFieldQuery,
  ): Promise<GetTotalPatientsByGenderResponse> {
    const { list: genders, total } =
      await this.getTotalPatientsByFieldUseCase.execute<TotalPatientsByGender>({
        field: 'gender',
        ...query,
      });

    return {
      success: true,
      message:
        'Lista com o total de pacientes por gênero retornado com sucesso.',
      data: { genders, total },
    };
  }

  @Get('patients/by-state')
  @RequireFeature('read:statistic')
  @ApiOperation({ summary: 'Número total de pacientes por estado' })
  @ZodResponse({ status: 200, type: GetTotalPatientsByStateResponse })
  async getTotalPatientsByState(
    @Query() query: GetTotalPatientsByFieldQuery,
  ): Promise<GetTotalPatientsByStateResponse> {
    const { list: states, total } =
      await this.getTotalPatientsByFieldUseCase.execute<TotalPatientsByState>({
        field: 'state',
        ...query,
      });

    return {
      success: true,
      message:
        'Lista com o total de pacientes por estado retornado com sucesso.',
      data: { states, total },
    };
  }

  @Get('patients/with-appointments')
  @RequireFeature('read:statistic')
  @ApiOperation({ summary: 'Número total de pacientes atendidos' })
  @ZodResponse({ status: 200, type: GetTotalPatientsWithAppointmentsResponse })
  async getTotalPatientsWithAppointments(
    @Query() query: GetTotalPatientsWithAppointmentsQuery,
  ): Promise<GetTotalPatientsWithAppointmentsResponse> {
    const total =
      await this.getTotalPatientsWithAppointmentsUseCase.execute(query);

    return {
      success: true,
      message: 'Número total de pacientes atendidos retornado com sucesso.',
      data: { total },
    };
  }

  @Get('patients/with-appointments/by-state')
  @RequireFeature('read:statistic')
  @ApiOperation({
    summary: 'Número total de pacientes atendidos por estado',
  })
  @ZodResponse({
    status: 200,
    type: GetTotalPatientsWithAppointmentsByStateResponse,
  })
  async getTotalPatientsWithAppointmentsByState(
    @Query() query: GetTotalPatientsWithAppointmentsByStateQuery,
  ): Promise<GetTotalPatientsWithAppointmentsByStateResponse> {
    const { list: states, total } =
      await this.getTotalPatientsWithAppointmentsByFieldUseCase.execute<TotalPatientsWithAppointmentsByState>(
        { field: 'state', ...query },
      );

    return {
      success: true,
      message:
        'Lista com o total de pacientes atendidos por estado retornada com sucesso.',
      data: { states, total },
    };
  }

  @Get('patients/with-referrals')
  @RequireFeature('read:statistic')
  @ApiOperation({ summary: 'Número total de pacientes encaminhados' })
  @ZodResponse({ status: 200, type: GetTotalPatientsWithReferralsResponse })
  async getTotalPatientsWithReferrals(
    @Query() query: GetTotalPatientsWithReferralsQuery,
  ): Promise<GetTotalPatientsWithReferralsResponse> {
    const total =
      await this.getTotalPatientsWithReferralsUseCase.execute(query);

    return {
      success: true,
      message: 'Número total de pacientes encaminhados retornado com sucesso.',
      data: { total },
    };
  }

  @Get('patients/with-referrals/by-state')
  @RequireFeature('read:statistic')
  @ApiOperation({
    summary: 'Número total de pacientes encaminhados por estado',
  })
  @ZodResponse({
    status: 200,
    type: GetTotalPatientsWithReferralsByStateResponse,
  })
  async getTotalPatientsWithReferralsByState(
    @Query() query: GetTotalPatientsWithReferralsByStateQuery,
  ): Promise<GetTotalPatientsWithReferralsByStateResponse> {
    const { list: states, total } =
      await this.getTotalPatientsWithReferralsByFieldUseCase.execute<TotalPatientsWithReferralsByState>(
        { field: 'state', ...query },
      );

    return {
      success: true,
      message:
        'Lista com o total de pacientes encaminhados por estado retornada com sucesso.',
      data: { states, total },
    };
  }

  // Referrals

  @Get('referrals/total')
  @RequireFeature('read:statistic')
  @ApiOperation({ summary: 'Número total de encaminhamentos' })
  @ZodResponse({ status: 200, type: GetTotalReferralsResponse })
  async getTotalReferrals(
    @Query() query: GetTotalReferralsQuery,
  ): Promise<GetTotalReferralsResponse> {
    const total = await this.getTotalReferralsUseCase.execute(query);

    return {
      success: true,
      message: 'Número total de encaminhamentos retornado com sucesso.',
      data: { total },
    };
  }

  @Get('referrals/by-category')
  @RequireFeature('read:statistic')
  @ApiOperation({
    summary: 'Número total de encaminhamentos por categoria',
  })
  @ZodResponse({ status: 200, type: GetTotalReferralsByCategoryResponse })
  async getTotalReferralsByCategory(
    @Query() query: GetTotalReferralsByCategoryQuery,
  ): Promise<GetTotalReferralsByCategoryResponse> {
    const { categories, total } =
      await this.getTotalReferralsByCategoryUseCase.execute(query);

    return {
      success: true,
      message:
        'Lista com o total de encaminhamentos por categoria retornada com sucesso.',
      data: { categories, total },
    };
  }
}
