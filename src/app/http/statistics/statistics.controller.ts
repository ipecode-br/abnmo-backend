import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';

import { GetPatientStatisticsDto } from '../patients/patients.dtos';
import { StatisticsService } from './statistics.service';

@ApiTags('Estatísticas')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('patients-by-gender')
  @Roles(['manager', 'nurse'])
  @ApiOperation({
    summary: 'Estatísticas de pacientes por gênero',
  })
  async getPatientStatistics(@Query() query: GetPatientStatisticsDto) {
    const data = await this.statisticsService.getPatientStatistics(query);

    return {
      success: true,
      message: 'Estatísticas de pacientes por gênero retornada com sucesso.',
      data,
    };
  }

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
}
