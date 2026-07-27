import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { SignatureService } from '@/app/signature/signature.service';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';

import { GetStatusResponse } from '../status.dtos';

@Log()
@Injectable()
export class GetStatusUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly signatureService: SignatureService,
    private readonly logger: LogService,
  ) {}

  async execute(): Promise<GetStatusResponse> {
    let success = true;
    let message = 'Sistema está operacional.';

    const data: GetStatusResponse['data'] = {
      api: { status: 'ok' },
      database: { status: 'ok' },
      signature: { status: 'ok' },
    };

    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      success = false;
      message = 'O banco de dados está indisponível.';
      data.database.status = 'error';
      this.logger.error('Database health check failed');
    }

    try {
      const signatureOk = await this.signatureService.check();

      if (!signatureOk) {
        data.signature.status = 'error';
        this.logger.error('Signature health check failed');
      }
    } catch {
      data.signature.status = 'error';
      this.logger.error('Signature health check failed');
    }

    return { success, message, data };
  }
}
