import { Global, Module } from '@nestjs/common';

import { ContextMiddleware } from '../context/context.middleware';
import { ContextService } from '../context/context.service';
import { AppLogger } from './logger.service';

@Global()
@Module({
  providers: [AppLogger, ContextMiddleware, ContextService],
  exports: [AppLogger, ContextMiddleware, ContextService],
})
export class LogModule {}
