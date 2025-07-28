import { Module } from '@nestjs/common';

import { EnvModule } from '@/env/env.module';

import { UtilsService } from './utils.service';

@Module({
  imports: [EnvModule],
  providers: [UtilsService],
  exports: [UtilsService],
})
export class UtilsModule {}
