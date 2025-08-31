import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import type {
  GetPatientsByGenderResponse,
  PatientsByGenderType,
} from '@/domain/schemas/statistics';

import { GetPatientsByPeriodDto } from './statistics.dtos';
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
    @Query() query: GetPatientsByPeriodDto,
  ): Promise<GetPatientsByGenderResponse> {
    const data =
      await this.statisticsService.getPatientsByPeriod<PatientsByGenderType>(
        'gender',
        query,
      );

    return {
      success: true,
      message: 'Estatísticas de pacientes por gênero retornada com sucesso.',
      data,
    };
  }
}
