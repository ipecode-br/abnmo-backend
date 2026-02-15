import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import type {
  TotalPatientsByCity,
  TotalPatientsByGender,
} from '@/domain/schemas/statistics/responses';

import {
  GetTotalAppointmentsByCategoryQuery,
  GetTotalAppointmentsByCategoryResponse,
  GetTotalAppointmentsResponse,
  GetTotalPatientsByCityResponse,
  GetTotalPatientsByFieldQuery,
  GetTotalPatientsByGenderResponse,
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
import { GetTotalPatientsWithAppointmentsByStateUseCase } from './use-cases/get-total-patients-with-appointments-by-state';
import { GetTotalPatientsWithReferralsUseCase } from './use-cases/get-total-patients-with-referrals.use-case';
import { GetTotalPatientsWithReferralsByStateUseCase } from './use-cases/get-total-patients-with-referrals-by-state.use-case';
import { GetTotalReferralsUseCase } from './use-cases/get-total-referrals.use-case';
import { GetTotalReferralsByCategoryUseCase } from './use-cases/get-total-referrals-by-category.use-case';

@ApiTags('Estatísticas')
@Roles(['manager', 'nurse'])
@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly getTotalAppointmentsUseCase: GetTotalAppointmentsUseCase,
    private readonly getTotalAppointmentsByCategoryUseCase: GetTotalAppointmentsByCategoryUseCase,
    private readonly getTotalPatientsUseCase: GetTotalPatientsUseCase,
    private readonly getTotalPatientsByFieldUseCase: GetTotalPatientsByFieldUseCase,
    private readonly getTotalPatientsWithAppointmentsUseCase: GetTotalPatientsWithAppointmentsUseCase,
    private readonly getTotalPatientsWithAppointmentsByStateUseCase: GetTotalPatientsWithAppointmentsByStateUseCase,
    private readonly getTotalPatientsWithReferralsByStateUseCase: GetTotalPatientsWithReferralsByStateUseCase,
    private readonly getTotalPatientsWithReferralsUseCase: GetTotalPatientsWithReferralsUseCase,
    private readonly getTotalReferralsUseCase: GetTotalReferralsUseCase,
    private readonly getTotalReferralsByCategoryUseCase: GetTotalReferralsByCategoryUseCase,
  ) {}

  // Appointments

  @Get('appointments/total')
  @ApiOperation({ summary: 'Número total de atendimentos' })
  @ApiResponse({ type: GetTotalAppointmentsResponse })
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
  @ApiOperation({
    summary: 'Número total de atendimentos por categoria',
  })
  @ApiResponse({ type: GetTotalAppointmentsByCategoryResponse })
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
  @ApiOperation({ summary: 'Número total de pacientes' })
  @ApiResponse({ type: GetTotalPatientsResponse })
  async getTotalPatients(): Promise<GetTotalPatientsResponse> {
    const total = await this.getTotalPatientsUseCase.execute();

    return {
      success: true,
      message: 'Número total de pacientes retornado com sucesso.',
      data: { total },
    };
  }

  @Get('patients/by-gender')
  @ApiOperation({ summary: 'Número total de pacientes por gênero' })
  @ApiResponse({ type: GetTotalPatientsByGenderResponse })
  async getTotalPatientsByGender(
    @Query() query: GetTotalPatientsByFieldQuery,
  ): Promise<GetTotalPatientsByGenderResponse> {
    const { items: genders, total } =
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

  @Get('patients/by-city')
  @ApiOperation({ summary: 'Número total de pacientes por cidade' })
  @ApiResponse({ type: GetTotalPatientsByCityResponse })
  async getTotalPatientsByCity(
    @Query() query: GetTotalPatientsByFieldQuery,
  ): Promise<GetTotalPatientsByCityResponse> {
    const { items: cities, total } =
      await this.getTotalPatientsByFieldUseCase.execute<TotalPatientsByCity>({
        field: 'city',
        ...query,
      });

    return {
      success: true,
      message:
        'Lista com o total de pacientes por cidade retornado com sucesso.',
      data: { cities, total },
    };
  }

  @Get('patients/with-appointments')
  @ApiOperation({ summary: 'Número total de pacientes atendidos' })
  @ApiResponse({ type: GetTotalPatientsWithAppointmentsResponse })
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
  @ApiOperation({
    summary: 'Número total de pacientes atendidos por estado',
  })
  @ApiResponse({ type: GetTotalPatientsWithAppointmentsByStateResponse })
  async getTotalPatientsWithAppointmentsByState(
    @Query() query: GetTotalPatientsWithAppointmentsByStateQuery,
  ): Promise<GetTotalPatientsWithAppointmentsByStateResponse> {
    const { states, total } =
      await this.getTotalPatientsWithAppointmentsByStateUseCase.execute(query);

    return {
      success: true,
      message:
        'Lista com o total de pacientes atendidos por estado retornada com sucesso.',
      data: { states, total },
    };
  }

  @Get('patients/with-referrals')
  @ApiOperation({ summary: 'Número total de pacientes encaminhados' })
  @ApiResponse({ type: GetTotalPatientsWithReferralsResponse })
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
  @ApiOperation({
    summary: 'Número total de pacientes encaminhados por estado',
  })
  @ApiResponse({ type: GetTotalPatientsWithReferralsByStateResponse })
  async getTotalPatientsWithReferralsByStatel(
    @Query() query: GetTotalPatientsWithReferralsByStateQuery,
  ): Promise<GetTotalPatientsWithReferralsByStateResponse> {
    const { states, total } =
      await this.getTotalPatientsWithReferralsByStateUseCase.execute(query);

    return {
      success: true,
      message:
        'Lista com o total de pacientes encaminhados por estado retornada com sucesso.',
      data: { states, total },
    };
  }

  // Referrals

  @Get('referrals/total')
  @ApiOperation({ summary: 'Número total de encaminhamentos' })
  @ApiResponse({ type: GetTotalReferralsResponse })
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
  @ApiOperation({
    summary: 'Número total de encaminhamentos por categoria',
  })
  @ApiResponse({ type: GetTotalReferralsByCategoryResponse })
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
