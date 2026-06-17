import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { Public } from '@/common/decorators/public.decorator';
import { Log } from '@/common/log/log.decorator';

import { GetStatusResponse } from './status.dtos';
import { GetStatusUseCase } from './use-cases/get-status.use-case';

@ApiTags('Status')
@Controller()
export class StatusController {
  constructor(private readonly getStatusUseCase: GetStatusUseCase) {}

  @Public()
  @Get('status')
  @Log('get_status')
  @ApiOperation({ summary: 'Verifica o status do sistema e do banco de dados' })
  @ApiResponse({ type: GetStatusResponse })
  async getStatus(@Res() res: Response): Promise<void> {
    const result = await this.getStatusUseCase.execute();

    if (!result.success) {
      res.status(503).json(result);
      return;
    }

    res.json(result);
  }
}
