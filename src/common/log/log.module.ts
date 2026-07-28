import { Global, Module } from '@nestjs/common';

import { EnvModule } from '@/env/env.module';

import { ContextMiddleware } from '../context/context.middleware';
import { ContextService } from '../context/context.service';
import { LogService } from './log.service';

@Global()
@Module({
  imports: [EnvModule],
  providers: [LogService, ContextMiddleware, ContextService],
  exports: [LogService, ContextMiddleware, ContextService],
})
export class LogModule {}
