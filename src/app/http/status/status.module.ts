import { Module } from '@nestjs/common';

import { StatusController } from './status.controller';
import { GetStatusUseCase } from './use-cases/get-status.use-case';

@Module({
  controllers: [StatusController],
  providers: [GetStatusUseCase],
})
export class StatusModule {}
