import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';

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
}
