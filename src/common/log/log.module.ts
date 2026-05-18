import { Global, Module } from '@nestjs/common';

import { ContextMiddleware } from '../context/context.middleware';
import { ContextService } from '../context/context.service';
import { LogService } from './log.service';

@Global()
@Module({
  providers: [LogService, ContextMiddleware, ContextService],
  exports: [LogService, ContextMiddleware, ContextService],
})
export class LogModule {}
